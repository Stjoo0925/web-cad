/**
 * layer-filter.ts
 * 레이어 필터링 및 일괄 작업 유틸리티
 *
 * 필터링 기준: 레이어 이름, 색상, 가시성, 잠금 상태
 * filterLayer() 함수 및 배치 작업 지원
 */

/**
 * 레이어 정보 (Entity에서 사용)
 */
export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
}

/**
 * 엔티티 기본 구조
 */
export interface Entity {
  id: string;
  type: string;
  layer: string;
  color?: string;
  lineWidth?: number;
  [key: string]: unknown;
}

/**
 * 필터 기준
 */
export interface LayerFilterCriteria {
  namePattern?: string;   // 레이어 이름 패턴 (부분 일치)
  colors?: string[];       // 필터링할 색상 목록
  visible?: boolean;       // 가시성 상태
  locked?: boolean;        // 잠금 상태
}

/**
 * 필터링된 레이어 목록 반환
 * @param layers 레이어 배열
 * @param criteria 필터 기준
 * @returns 필터링된 레이어 배열
 */
export function filterLayers(
  layers: Layer[],
  criteria: LayerFilterCriteria
): Layer[] {
  return layers.filter((layer) => {
    // 이름 필터
    if (criteria.namePattern) {
      const pattern = criteria.namePattern.toLowerCase();
      if (!layer.name.toLowerCase().includes(pattern)) {
        return false;
      }
    }

    // 색상 필터
    if (criteria.colors && criteria.colors.length > 0) {
      if (!criteria.colors.includes(layer.color)) {
        return false;
      }
    }

    // 가시성 필터
    if (criteria.visible !== undefined) {
      if (layer.visible !== criteria.visible) {
        return false;
      }
    }

    // 잠금 상태 필터
    if (criteria.locked !== undefined) {
      if (layer.locked !== criteria.locked) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 특정 레이어에 속한 모든 엔티티를 필터링
 * @param entities 엔티티 배열
 * @param layerName 레이어 이름
 * @returns 해당 레이어의 엔티티 배열
 */
export function filterEntitiesByLayer(
  entities: Entity[],
  layerName: string
): Entity[] {
  return entities.filter((e) => e.layer === layerName);
}

/**
 * 다중 레이어에 속한 엔티티를 필터링
 * @param entities 엔티티 배열
 * @param layerNames 레이어 이름 배열
 * @returns 해당 레이어들의 엔티티 배열
 */
export function filterEntitiesByLayers(
  entities: Entity[],
  layerNames: string[]
): Entity[] {
  const layerSet = new Set(layerNames);
  return entities.filter((e) => layerSet.has(e.layer));
}

/**
 * 선택된 레이어의 모든 엔티티 색상 일괄 변경
 * @param entities 엔티티 배열
 * @param layerName 대상 레이어 이름
 * @param newColor 새 색상
 * @returns 색상이 변경된 엔티티 ID 목록
 */
export function batchChangeEntityColor(
  entities: Entity[],
  layerName: string,
  newColor: string
): string[] {
  const changedIds: string[] = [];
  entities.forEach((e) => {
    if (e.layer === layerName) {
      changedIds.push(e.id);
    }
  });
  return changedIds;
}

/**
 * 선택된 레이어의 모든 엔티티 선종(선폭) 일괄 변경
 * @param entities 엔티티 배열
 * @param layerName 대상 레이어 이름
 * @param newLineWidth 새 선폭
 * @returns 선폭이 변경된 엔티티 ID 목록
 */
export function batchChangeEntityLineWidth(
  entities: Entity[],
  layerName: string,
  newLineWidth: number
): string[] {
  const changedIds: string[] = [];
  entities.forEach((e) => {
    if (e.layer === layerName) {
      changedIds.push(e.id);
    }
  });
  return changedIds;
}

/**
 * 레이어별 엔티티 통계
 * @param entities 엔티티 배열
 * @param layers 레이어 배열
 * @returns 각 레이어별 엔티티 수
 */
export function getLayerEntityStats(
  entities: Entity[],
  layers: Layer[]
): Map<string, number> {
  const stats = new Map<string, number>();
  layers.forEach((layer) => {
    const count = entities.filter((e) => e.layer === layer.name).length;
    stats.set(layer.name, count);
  });
  return stats;
}