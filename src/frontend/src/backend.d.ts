import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface AnalysisRecord {
    id: string;
    status: AnalysisStatus;
    roomLabels: Array<RoomLabel>;
    scoreBreakdown: ScoreBreakdown;
    floorPlanImage?: ExternalBlob;
    userId: Principal;
    structuralChanges: Array<string>;
    floorPlanName: string;
    issues: Array<string>;
    easyFixes: Array<string>;
    vastuScore: bigint;
    uploadedAt: bigint;
}
export interface ScoreBreakdown {
    energyBalance: bigint;
    bedrooms: bigint;
    kitchen: bigint;
    entrance: bigint;
    toilets: bigint;
}
export interface RoomLabel {
    x: bigint;
    y: bigint;
    direction: string;
    room: string;
}
export interface UserProfile {
    name: string;
}
export enum AnalysisStatus {
    pending = "pending",
    complete = "complete"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAnalysis(floorPlanName: string, floorPlanImage: ExternalBlob | null): Promise<string>;
    deleteAnalysis(id: string): Promise<void>;
    getAllAnalyses(): Promise<Array<AnalysisRecord>>;
    getAnalysis(id: string): Promise<AnalysisRecord>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserAnalyses(): Promise<Array<AnalysisRecord>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateAnalysis(id: string, updatedAnalysis: AnalysisRecord): Promise<void>;
}
