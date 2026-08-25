"use client";

import { useState } from "react";
import {
  DownloadOutlined,
  FilePdfOutlined,
  PictureOutlined,
} from "@ant-design/icons";

function getLocalDateStamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function sanitizeFileName(value) {
  return String(value || "file")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function copyComputedStyles(sourceNode, targetNode) {
  if (!(sourceNode instanceof Element) || !(targetNode instanceof Element)) {
    return;
  }

  const computedStyle = window.getComputedStyle(sourceNode);
  let styleText = "";

  for (const propertyName of computedStyle) {
    styleText += `${propertyName}:${computedStyle.getPropertyValue(propertyName)};`;
  }

  targetNode.setAttribute("style", styleText);

  const sourceChildren = Array.from(sourceNode.children || []);
  const targetChildren = Array.from(targetNode.children || []);

  sourceChildren.forEach((child, index) => {
    copyComputedStyles(child, targetChildren[index]);
  });
}

async function imageUrlToDataUrl(url) {
  try {
    const response = await fetch(url, { mode: "cors" });
    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function prepareCloneForImageExport(sourceElement) {
  const clone = sourceElement.cloneNode(true);

  clone.querySelectorAll("[data-matrix-no-print]").forEach((node) => {
    node.remove();
  });

  clone.querySelectorAll("[data-matrix-scroll]").forEach((node) => {
    node.style.overflow = "visible";
  });

  clone.style.width = `${sourceElement.scrollWidth}px`;
  clone.style.maxWidth = "none";
  clone.style.overflow = "visible";
  clone.style.boxShadow = "none";

  copyComputedStyles(sourceElement, clone);

  const sourceImages = Array.from(sourceElement.querySelectorAll("img"));
  const cloneImages = Array.from(clone.querySelectorAll("img"));

  await Promise.all(
    cloneImages.map(async (imageNode, index) => {
      const sourceImage = sourceImages[index];
      const sourceUrl = sourceImage?.currentSrc || sourceImage?.src;

      if (!sourceUrl) {
        return;
      }

      const dataUrl = await imageUrlToDataUrl(sourceUrl);

      if (dataUrl) {
        imageNode.setAttribute(
          "src",
          dataUrl
        );
      } else {
        imageNode.removeAttribute("src");
        imageNode.style.display ="none";
      }
    })
  );

  return clone;
}

async function exportElementToPng({ element, fileName }) {
  const clone = await prepareCloneForImageExport(element);
  const width = Math.max(element.scrollWidth, clone.scrollWidth, element.offsetWidth);
  const height = Math.max(element.scrollHeight, clone.scrollHeight, element.offsetHeight);
  const pixelRatio = Math.min(window.devicePixelRatio || 2, 2);

  const wrapper = document.createElement("div");
  wrapper.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  wrapper.style.width = `${width}px`;
  wrapper.style.height = `${height}px`;
  wrapper.style.background = "#ffffff";
  wrapper.appendChild(clone);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(wrapper)}</foreignObject>
    </svg>
  `;

  const svgBlob = new Blob([svg], {
    type: "image/svg+xml;charset=utf-8",
  });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width * pixelRatio);
    canvas.height = Math.ceil(height * pixelRatio);

    const ctx = canvas.getContext("2d");
    ctx.scale(pixelRatio, pixelRatio);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    const pngUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `${sanitizeFileName(fileName)}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export default function DepartmentMatrixPdfExport({
  disabled = false,
}) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingImage, setExportingImage] = useState(false);

  const exportBaseName = `business-structure-departments-${getLocalDateStamp()}`;

  const handleExportPdf = () => {
    if (disabled || exportingPdf || typeof window === "undefined") {
      return;
    }

    const previousTitle = document.title;

    try {
      setExportingPdf(true);
      document.title = exportBaseName;
      window.print();
    } finally {
      document.title = previousTitle;
      setExportingPdf(false);
    }
  };

  const handleExportImage = async () => {
    if (
      disabled ||
      exportingImage ||
      typeof window === "undefined" ||
      typeof document === "undefined"
    ) {
      return;
    }

    const exportRoot = document.getElementById("department-matrix-print-root");
    if (!exportRoot) {
      return;
    }

    try {
      setExportingImage(true);
      await exportElementToPng({
        element: exportRoot,
        fileName: exportBaseName,
      });
    } catch (error) {
      console.error("Export image failed:", error);
      window.alert("ไม่สามารถดาวน์โหลดรูปได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setExportingImage(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={handleExportImage}
        disabled={disabled || exportingImage || exportingPdf}
        data-matrix-no-print
        title="ดาวน์โหลด Matrix View เป็นรูป PNG"
        className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {exportingImage ? <DownloadOutlined /> : <PictureOutlined />}
        {exportingImage ? "Preparing Image..." : "Download Image"}
      </button>

      <button
        type="button"
        onClick={handleExportPdf}
        disabled={disabled || exportingPdf || exportingImage}
        data-matrix-no-print
        title="Export Matrix View เป็น PDF"
        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FilePdfOutlined />
        {exportingPdf ? "Preparing PDF..." : "Export PDF"}
      </button>
    </div>
  );
}
