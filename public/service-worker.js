self.addEventListener("install", () => {
  console.log("Service Worker instalado");
});

self.addEventListener("fetch", () => {
  // sem cache por agora
});
  