/**
 * health-server.ts
 * 헬스체크 및 서비스 상태 점검 서버
 *
 * API, worker, files, DB 컨테이너의 헬스체크와 의존 관계를 관리합니다.
 * Docker Compose의 healthcheck와 연동됩니다.
 */

import http from "node:http";

/**
 * 서비스 상태
 */
const ServiceStatus = {
  HEALTHY: "healthy",
  UNHEALTHY: "unhealthy",
  STARTING: "starting",
  STOPPED: "stopped"
} as const;

type ServiceStatusValue = typeof ServiceStatus[keyof typeof ServiceStatus];

/**
 * 서비스 정의
 */
interface ServiceDefinition {
  name: string;
  url: string | null;
  required: boolean;
}

/**
 * 서비스 상태 정보
 */
interface ServiceState extends ServiceDefinition {
  status: ServiceStatusValue;
}

/**
 * 서비스 상태 조회 결과
 */
interface ServicesStatusResponse {
  name: string;
  url: string | null;
  required: boolean;
  status: ServiceStatusValue;
}

/**
 * 헬스체크 응답 (전체)
 */
interface HealthCheckResponse {
  status: ServiceStatusValue;
  timestamp: string;
  services: ServicesStatusResponse[];
}

/**
 * 활성 상태 응답
 */
interface LivenessResponse {
  status: ServiceStatusValue;
  timestamp: string;
}

/**
 * 준비 상태 응답 (준비됨)
 */
interface ReadinessResponseReady {
  status: ServiceStatusValue;
  timestamp: string;
  readyServices: string[];
}

/**
 * 준비 상태 응답 (준비 안됨)
 */
interface ReadinessResponseNotReady {
  status: ServiceStatusValue;
  timestamp: string;
  notReadyServices: string[];
}

type ReadinessResponse = ReadinessResponseReady | ReadinessResponseNotReady;

/**
 * 개별 서비스 상태 응답
 */
interface ServicesStatusResponseWrapper {
  services: ServicesStatusResponse[];
  timestamp: string;
}

/**
 * Docker healthcheck 설정
 */
interface DockerHealthCheck {
  test: string[];
  interval: string;
  timeout: string;
  retries: number;
  startPeriod: string;
}

/**
 * HealthServer 옵션
 */
interface HealthServerOptions {
  port?: number;
  services?: ServiceDefinition[];
}

/**
 * HealthServer 클래스
 *
 * 헬스체크 서버를 생성하여 서비스 상태를 관리합니다.
 */
class HealthServer {
  port: number;
  services: ServiceDefinition[];
  server: http.Server | null;

  constructor(options: HealthServerOptions = {}) {
    this.port = options.port ?? 4010;
    this.services = options.services ?? [
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
  start(): Promise<http.Server> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.on("error", reject);

      this.server.listen(this.port, () => {
        console.log(`헬스체크 서버 시작: 포트 ${this.port}`);
        resolve(this.server!);
      });
    });
  }

  /**
   * 서버를 종료합니다.
   *
   * @returns {Promise<void>}
   */
  async stop(): Promise<void> {
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
  handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const url = req.url;

    if (url === "/health" || url === "/") {
      this.handleHealthCheck(res).catch(err => { console.error(err); });
    } else if (url === "/health/live") {
      this.handleLivenessCheck(res);
    } else if (url === "/health/ready") {
      this.handleReadinessCheck(res).catch(err => { console.error(err); });
    } else if (url === "/health/services") {
      this.handleServicesStatus(res).catch(err => { console.error(err); });
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
  async handleHealthCheck(res: http.ServerResponse): Promise<void> {
    const statuses = await this.getServicesStatus();
    const status = this.getOverallStatusFromServices(statuses);

    res.writeHead(status === ServiceStatus.HEALTHY ? 200 : 503, {
      "Content-Type": "application/json"
    });

    const response: HealthCheckResponse = {
      status,
      timestamp: new Date().toISOString(),
      services: statuses
    };
    res.end(JSON.stringify(response));
  }

  /**
   * 활성 상태 체크 (/health/live)
   * 컨테이너가 실행 중인지만 확인
   *
   * @param {http.ServerResponse} res
   */
  handleLivenessCheck(res: http.ServerResponse): void {
    const response: LivenessResponse = {
      status: ServiceStatus.HEALTHY,
      timestamp: new Date().toISOString()
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(response));
  }

  /**
   * 준비 상태 체크 (/health/ready)
   * 모든 의존 서비스가 준비되었는지 확인
   *
   * @param {http.ServerResponse} res
   */
  async handleReadinessCheck(res: http.ServerResponse): Promise<void> {
    const statuses = await this.getServicesStatus();
    const requiredReady = statuses
      .filter((s) => s.required)
      .every((s) => s.status === ServiceStatus.HEALTHY);

    if (requiredReady) {
      const response: ReadinessResponseReady = {
        status: ServiceStatus.HEALTHY,
        timestamp: new Date().toISOString(),
        readyServices: statuses.filter((s) => s.status === ServiceStatus.HEALTHY).map((s) => s.name)
      };
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(response));
    } else {
      const response: ReadinessResponseNotReady = {
        status: ServiceStatus.UNHEALTHY,
        timestamp: new Date().toISOString(),
        notReadyServices: statuses.filter((s) => s.required && s.status !== ServiceStatus.HEALTHY).map((s) => s.name)
      };
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify(response));
    }
  }

  /**
   * 개별 서비스 상태 (/health/services)
   *
   * @param {http.ServerResponse} res
   */
  async handleServicesStatus(res: http.ServerResponse): Promise<void> {
    const services = await this.getServicesStatus();
    const response: ServicesStatusResponseWrapper = {
      services,
      timestamp: new Date().toISOString()
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(response));
  }

  /**
   * 전체 서비스 상태 조회
   *
   * @returns {Promise<ServicesStatusResponse[]>}
   */
  async getServicesStatus(): Promise<ServicesStatusResponse[]> {
    return Promise.all(
      this.services.map(async (service) => {
        return {
          name: service.name,
          url: service.url,
          required: service.required,
          status: service.url ? await this.checkService(service.url) : ServiceStatus.HEALTHY
        };
      })
    );
  }

  /**
   * 서비스 상태 확인 (간단한 HTTP GET)
   *
   * @param {string} url - 확인할 URL
   * @returns {Promise<ServiceStatusValue>} 서비스 상태
   */
  async checkService(url: string): Promise<ServiceStatusValue> {
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
   * @param {ServicesStatusResponse[]} statuses
   * @returns {ServiceStatusValue}
   */
  getOverallStatusFromServices(statuses: ServicesStatusResponse[]): ServiceStatusValue {
    const requiredUnhealthy = statuses
      .filter((s) => s.required && s.status !== ServiceStatus.HEALTHY)
      .length;

    return requiredUnhealthy > 0 ? ServiceStatus.UNHEALTHY : ServiceStatus.HEALTHY;
  }
}

/**
 * Docker Compose healthcheck용 헬스체크 생성
 *
 * @returns {DockerHealthCheck} healthcheck 설정 객체
 */
function createDockerHealthCheck(): DockerHealthCheck {
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
async function main(): Promise<void> {
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

export {
  HealthServer,
  ServiceStatus,
  createDockerHealthCheck
};

if (import.meta.main) {
  main();
}
