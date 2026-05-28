import sigunguMapJson from '@/data/curated/sigungu-to-district.json';
import type { OfficeKind } from '@/types/domain';

export interface SigunguMapEntry {
  sidoCode4: string;
  guCode4: string;
  sigunguCode5: string;
  districtIds: ReadonlyArray<{ officeKind: OfficeKind; districtId: string }>;
}

export interface SidoMapEntry {
  sidoCode4: string;
  districtIds: ReadonlyArray<{ officeKind: OfficeKind; districtId: string }>;
}

interface SigunguMapFile {
  version: number;
  generatedAt: string;
  notes?: string[];
  sidoMap: Record<string, SidoMapEntry>;
  sigunguMap: Record<string, SigunguMapEntry>;
}

const FILE = sigunguMapJson as unknown as SigunguMapFile;

export function getSidoEntry(sidoName: string): SidoMapEntry | null {
  return FILE.sidoMap[sidoName] ?? null;
}

export function getSigunguEntry(sidoName: string, sigunguName: string): SigunguMapEntry | null {
  const key = `${sidoName}|${sigunguName}`;
  return FILE.sigunguMap[key] ?? null;
}

export function sigunguMapMetadata() {
  return {
    version: FILE.version,
    generatedAt: FILE.generatedAt,
    sigunguCount: Object.keys(FILE.sigunguMap).length,
    sidoCount: Object.keys(FILE.sidoMap).length,
  };
}
