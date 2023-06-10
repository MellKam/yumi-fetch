import { Addon, ResponsePromise } from "../core.ts";

export type ProgressCallback = (loaded: number, total: number | null) => void;

interface Progress {
  progress<T_Resolvers>(
    this: ResponsePromise<T_Resolvers>,
    callback: ProgressCallback,
  ): ResponsePromise<T_Resolvers> & T_Resolvers;
}

export const progress: Addon<unknown, unknown, Progress> = (client) => {
  return client.addResolvers({
    progress(callback: ProgressCallback) {
      return this._then((res) => {
        const contentLength = res.headers.get("Content-Length");
        const _total = contentLength ? +contentLength : null;
        const total = typeof _total == "number"
          ? isNaN(_total) ? null : _total
          : null;

        if (!res.body) return res;

        let loaded = 0;
        callback(loaded, total);

        const transform = new TransformStream({
          transform(chunk, controller) {
            loaded += chunk.length;
            callback(loaded, total);
            controller.enqueue(chunk);
          },
        });

        return new Response(res.body.pipeThrough(transform), res);
      });
    },
  });
};
