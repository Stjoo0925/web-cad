/**
 * health-server.js
 * 헬스체크 및 서비스 상태 점검 서버
 *
 * API, worker, files, DB 컨테이너의 헬스체크와 의존 관계를 관리합니다.
 * Docker Compose의 healthcheck와 연동됩니다.
 */

const http = require("http");

/**
 * 서비스 상태
 */
const ServiceStatus = {
  HEALTHY: "healthy",
  UNHEALTHY: "unhealthy",
  STARTING: "starting",
  STOPPED: "stopped"
};

/**
 * HealthServer 클래스
 *
 * 헬스체크 서버를 생성하여 서비스 상태를 관리합니다.
 */
class HealthServer {
  /**
   * @param {Object} options - 서버 옵션
   * @param {number} [options.port=4010] - 헬스체크 포트
   * @param {Object[]} [options.services] - 모니터링할 서비스 목록
   */
  constructor(options = {}) {
    this.port = options.port || 4010;
    this.services = options.services || [
      { name: "api", url: "http://localhost:4010/health", required: true },
      { name: "files", url: "http://localhost:4011/health", required: true },
      { name: "worker", url: null, required: false }
    ];
    this.server = null;
  }

  /**
   * 헬스체크 서버를 시작합니다.
   *
   * @returns {Promise<http.Server>}
   */
  start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.on("error", reject);

      this.server.listen(this.port, () => {
        console.log(`헬스체크 서버 시작: 포트 ${this.port}`);
        resolve(this.server);
      });
    });
  }

  /**
   * 서버를 종료합니다.
   *
   * @returns {Promise<void>}
   */
  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log("헬스체크 서버 종료");
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * HTTP 요청 처리
   *
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   */
  handleRequest(req, res) {
    const url = req.url;

    if (url === "/health" || url === "/") {
      this.handleHealthCheck(res);
    } else if (url === "/health/live") {
      this.handleLivenessCheck(res);
    } else if (url === "/health/ready") {
      this.handleReadinessCheck(res);
    } else if (url === "/health/services") {
      this.handleServicesStatus(res);
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Found" }));
    }
  }

  /**
   * 종합 헬스체크 (/health)
   *
   * @param {http.ServerResponse} res
   */
  handleHealthCheck(res) {
    const status = this.getOverallStatus();

    res.writeHead(status === ServiceStatus.HEALTHY ? 200 : 503, {
      "Content-Type": "application/json"
    });

    res.end(JSON.stringify({
      status,
      timestamp: new Date().toISOString(),
      services: this.getServicesStatus()
    }));
  }

  /**
   * 활성 상태 체크 (/health/live)
   * 컨테이너가 실행 중인지만 확인
   *
   * @param {http.ServerResponse} res
   */
  handleLivenessCheck(res) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: ServiceStatus.HEALTHY,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * 준비 상태 체크 (/health/ready)
   * 모든 의존 서비스가 준비되었는지 확인
   *
   * @param {http.ServerResponse} res
   */
  handleReadinessCheck(res) {
    const statuses = this.getServicesStatus();
    const requiredReady = statuses
      .filter((s) => s.required)
      .every((s) => s.status === ServiceStatus.HEALTHY);

    if (requiredReady) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: ServiceStatus.HEALTHY,
        timestamp: new Date().toISOString(),
        readyServices: statuses.filter((s) => s.status === ServiceStatus.HEALTHY).map((s) => s.name)
      }));
    } else {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: ServiceStatus.UNHEALTHY,
        timestamp: new Date().toISOString(),
        notReadyServices: statuses.filter((s) => s.required && s.status !== ServiceStatus.HEALTHY).map((s) => s.name)
      }));
    }
  }

  /**
   * 개별 서비스 상태 (/health/services)
   *
   * @param {http.ServerResponse} res
   */
  handleServicesStatus(res) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      services: this.getServicesStatus(),
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * 전체 서비스 상태 조회
   *
   * @returns {Object[]}
   */
  getServicesStatus() {
    return this.services.map((service) => {
      return {
        name: service.name,
        url: service.url,
        required: service.required,
        status: service.url ? this.checkService(service.url) : ServiceStatus.HEALTHY
      };
    });
  }

  /**
   * 서비스 상태 확인 (간단한 HTTP GET)
   *
   * @param {string} url - 확인할 URL
   * @returns {string} 서비스 상태
   */
  async checkService(url) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(url, {
        signal: controller.signal
      });

      clearTimeout(timeout);

      return response.ok ? ServiceStatus.HEALTHY : ServiceStatus.UNHEALTHY;
    } catch {
      return ServiceStatus.UNHEALTHY;
    }
  }

  /**
   * 전체 서비스 상태 결정
   *
   * @returns {string}
   */
  getOverallStatus() {
    const statuses = this.getServicesStatus();
    const requiredUnhealthy = statuses
      .filter((s) => s.required && s.status !== ServiceStatus.HEALTHY)
      .length;

    return requiredUnhealthy > 0 ? ServiceStatus.UNHEALTHY : ServiceStatus.HEALTHY;
  }
}

/**
 * Docker Compose healthcheck용 헬스체크 생성
 *
 * @returns {Object} healthcheck 설정 객체
 */
function createDockerHealthCheck() {
  return {
    test: ["CMD", "curl", "-f", "http://localhost:4010/health/live"],
    interval: "30s",
    timeout: "10s",
    retries: 3,
    startPeriod: "10s"
  };
}

/**
 * standalone 모드로 실행
 */
async function main() {
  const port = parseInt(process.env.HEALTH_PORT || "4010", 10);
  const server = new HealthServer({ port });

  try {
    await server.start();
    console.log(`헬스체크 서버 실행 중: http://localhost:${port}/health`);
  } catch (err) {
    console.error("서버 시작 실패:", err);
    process.exit(1);
  }

  process.on("SIGTERM", async () => {
    console.log("SIGTERM 수신, 서버 종료 중...");
    await server.stop();
    process.exit(0);
  });
}

module.exports = {
  HealthServer,
  ServiceStatus,
  createDockerHealthCheck
};

if (require.main === module) {
  main();
}