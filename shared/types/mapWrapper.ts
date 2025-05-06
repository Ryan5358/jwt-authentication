export default interface IMapWrapper<T, K, V> {
    value: T;
    set(key: K, value: V): void | Promise<void>
    get(key: K): V | null | Promise<V | null>
    has(key: K): boolean | Promise<boolean>
}