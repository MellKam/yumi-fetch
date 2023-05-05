import {
  YumiFetch,
  defaultDeserializers,
  defaultSerializers,
} from "yumi-fetch";

const yumi = new YumiFetch({
  baseURL: "https://jsonplaceholder.typicode.com/",
  deserializers: defaultDeserializers,
  serializers: defaultSerializers,
});

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

const createdPost = await yumi
  .post<CreatePostDTO>("/posts", {
    json: {
      title: "foo",
      body: "safasdd",
      userId: 2,
    },
  })
  .json<Post>();

console.log(createdPost);
