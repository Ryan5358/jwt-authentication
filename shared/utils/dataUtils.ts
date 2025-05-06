function hasKey<T>(key: string | number | symbol, keys: (keyof T)[]): key is keyof T {
    return keys.includes(key as keyof T);
}

export function mapTo<T>(data: any, keys: (keyof T)[]): T {
    const user: Partial<T> = {};

    Object.keys(data).forEach((key) => {
        if (hasKey<T>(key, keys)) {
            user[key as keyof T] = data[key];
        }
    });

    return user as T;
}