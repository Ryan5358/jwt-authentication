import Post from "@_types/post";

let posts: Post[] = [
    { id: 1, author_id: 2, title: "Hello world" },
    { id: 2, author_id: 2, title: "Post 1_1" },
    { id: 3, author_id: 2, title: "Hello" },
]

export const getPost = (id: number): Post | undefined => {
    return posts.find(post => post.id === id);
}

export const findPosts = (postInfo: Partial<Post>): Post[] => {
    return posts.filter(post => {
        return Object.entries(postInfo).some(([key, value]) => post[key as keyof Post] === value)
    })
}

export const addPost = (post: Post): void => {
    posts.push(post);
}

export const updateUser = (id: number, updatedPost: Partial<Post>): boolean => {
    const post = posts.find(post => post.id === id)
    if (post) {
        Object.assign(post, updatedPost);
        return true;
    }
    return false;
}

export const deleteUser = (id: number): boolean => {
    const postIndex = posts.findIndex(post => post.id === id);
    if (postIndex !== -1) {
        posts.splice(postIndex, 1);
        return true;
    }
    return false;
}


