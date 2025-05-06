export default interface IListWrapper<T, I> {
    value: T;
    exists(item: I): boolean | Promise<boolean>;
    rpush(item: I): void | Promise<void>;
    delete(item: I): boolean | Promise<boolean>;
}