"use client";

import { Editor } from "@tinymce/tinymce-react";
import { useRef } from "react";

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function RichEditor({ value, onChange }: Props) {
  const editorRef = useRef<any>(null);

  return (
    <Editor
      apiKey="jvm0whgb7vfvzqeh0wi0dqugvlmwjjfplgqf56jk2c7gucfj" // можно оставить пустым, если подключаешь локально
      onInit={(_, editor) => (editorRef.current = editor)}
      value={value}
      onEditorChange={(newValue) => onChange(newValue)}
      init={{
        height: 420,
        menubar: false,
        plugins: [
          "advlist",
          "autolink",
          "lists",
          "link",
          "image",
          "charmap",
          "preview",
          "anchor",
          "searchreplace",
          "visualblocks",
          "code",
          "fullscreen",
          "insertdatetime",
          "media",
          "table",
          "code",
          "help",
          "wordcount",
        ],
        toolbar:
          "undo redo | blocks | bold italic underline | " +
          "alignleft aligncenter alignright alignjustify | " +
          "bullist numlist outdent indent | removeformat | code",
        skin: "oxide-dark",
        content_css: "dark",
      }}
    />
  );
}
