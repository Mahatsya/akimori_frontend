import ky from "ky";

export const http = ky.create({
  timeout: 15000,
  retry: { limit: 2 },
  headers: { Accept: "application/json" },
  hooks: {
    beforeRequest: [
      (req) => {
        // no-store для SSR/клиента — как у тебя было
        req.headers.set("cache-control", "no-store");
      },
    ],
  },
});
