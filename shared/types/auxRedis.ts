export interface AuxiliaryRedisMembers {
    key: string;
    update(): unknown;
    expire(ttl: number): Promise<boolean>
}