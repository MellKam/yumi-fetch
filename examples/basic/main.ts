import { yumi } from "yumi-fetch";

type Post = {
  id: number;
  title: string;
  body: string;
  userId: number;
};

type CreatePostDTO = {
  title: string;
  body: string;
  userId: number;
};

const post = await yumi
  .post<CreatePostDTO>("https://jsonplaceholder.typicode.com/posts", {
    json: {
      title: "foo",
      body: "bar",
      userId: 2,
    },
  })
  .json<Post>();

console.log(post);
