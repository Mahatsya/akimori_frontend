"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { Editor as TinyMCEEditor } from "tinymce";

const Editor = dynamic(() => import("@tinymce/tinymce-react").then(m => m.Editor), {
  ssr: false,
});

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  dark?: boolean; // можно принудительно задать тему, но лучше auto
};

export default function TinyEditor({
  value,
  onChange,
  placeholder = "Введите текст…",
  minHeight = 380,
  dark,
}: Props) {
  const apiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY || process.env.TINYMCE_API_KEY || "";

  // Базовый обработчик загрузки изображений — инлайнит base64 (чтобы сразу работало без бэка)
  // Позже можешь заменить на реальную загрузку (см. ниже "Опция: загрузка на Django")
  async function imagesUploadHandler(blobInfo: any): Promise<string> {
    const base64 = blobInfo.base64();
    const mime = blobInfo.blob().type || "image/png";
    return `data:${mime};base64,${base64}`;
  }

  const init = useMemo(() => {
    const darkMode = typeof dark === "boolean" ? dark : window?.matchMedia?.("(prefers-color-scheme: dark)")?.matches;

    return {
      menubar: false,
      branding: false,
      height: minHeight,
      skin: darkMode ? "oxide-dark" : "oxide",
      content_css: darkMode ? "dark" : "default",
      contextmenu: false,
      statusbar: true,

      // тулбары и плагины — под блог/новости
      plugins: [
        "advlist", "autolink", "lists", "link", "image", "charmap", "preview",
        "anchor", "searchreplace", "visualblocks", "code", "fullscreen",
        "insertdatetime", "media", "table", "help", "wordcount",
      ],
      toolbar: [
        "undo redo | blocks fontsize | bold italic underline forecolor backcolor |",
        "alignleft aligncenter alignright alignjustify | bullist numlist outdent indent |",
        "link image media table | removeformat | code preview fullscreen",
      ].join(" "),
      toolbar_mode: "sliding",

      // Параметры контента
      block_formats: "Абзац=p; Заголовок 2=h2; Заголовок 3=h3; Заголовок 4=h4; Код=pre",
      content_style: `
        body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol'; line-height: 1.6; }
        img { max-width: 100%; height: auto; }
        table { width: 100%; border-collapse: collapse; }
        table, th, td { border: 1px solid #4444; }
        th, td { padding: 6px 8px; }
        pre, code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
      `,

      // Картинки — по умолчанию инлайн base64 (работает сразу)
      automatic_uploads: true,
      images_upload_handler: imagesUploadHandler,
      paste_data_images: true, // разрешим вставлять из буфера

      // Ссылки/медиа
      link_default_target: "_blank",
      link_assume_external_targets: "https",
      media_live_embeds: true,

      // UX
      placeholder,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minHeight, placeholder, dark]);

  return (
    <Editor
      apiKey={apiKey || undefined}
      value={value}
      onEditorChange={(content: string, _editor: TinyMCEEditor) => onChange(content)}
      init={init as any}
    />
  );
}
