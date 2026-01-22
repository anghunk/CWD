<template>
  <div id="comments" ref="commentsRoot"></div>
</template>

<script setup>
import { onMounted, ref } from "vue";

const commentsRoot = ref(null);

onMounted(async () => {
  if (!commentsRoot.value || typeof window === "undefined") return;

  const apiBaseUrl = "https://cwd-api.anghunk.workers.dev";

  if (!apiBaseUrl) return;

  if (!window.CWDComments) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cwd.js.org/cwd.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (e) => reject(e);
      document.head.appendChild(script);
    }).catch(() => {});
  }

  if (!window.CWDComments) return;

  const comments = new window.CWDComments({
    el: commentsRoot.value,
    apiBaseUrl,
  });

  comments.mount();
});
</script>
