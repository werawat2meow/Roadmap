"use client";

import { useState } from "react";
import {
  toPng,
} from "html-to-image";

import {
  DownloadOutlined,
  FilePdfOutlined,
  PictureOutlined,
} from "@ant-design/icons";

/* =========================================================
   Date
========================================================= */

function getLocalDateStamp() {
  const now = new Date();
  const year =
    now.getFullYear();
  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );
  return `${year}-${month}-${day}`;
}

/* =========================================================
   File Name
======================================================== */

function sanitizeFileName(
  value
) {
  return String(
    value || "file"
  )
    .replace(
      /[^a-zA-Z0-9-_]+/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    )
    .replace(
      /^-|-$/g,
      ""
    );
}

/* =========================================================
   Copy Computed Style
========================================================= */

function copyComputedStyles(
  sourceNode,
  targetNode
) {
  if (
    !(
      sourceNode instanceof
      Element
    ) ||
    !(
      targetNode instanceof
      Element
    )
  ) {
    return;
  }

  const computedStyle =
    window.getComputedStyle(
      sourceNode
    );
  let styleText = "";

  for (
    const propertyName of
    computedStyle
  ) {
    styleText +=
      `${propertyName}:` +
      `${computedStyle.getPropertyValue(
        propertyName
      )};`;
  }

  targetNode.setAttribute(
    "style",
    styleText
  );

  const sourceChildren =
    Array.from(
      sourceNode.children ||
        []
    );

  const targetChildren =
    Array.from(
      targetNode.children ||
        []
    );

  sourceChildren.forEach(
    (
      child,
      index
    ) => {
      copyComputedStyles(
        child,
        targetChildren[
          index
        ]
      );
    }
  );
}

function getSpacesObjectKey(
  url
) {
  if (!url) {
    return "";
  }

  try {
    const parsed =
      new URL(
        url,
        window.location.origin
      );

    const hostname =
      String(
        parsed.hostname ||
          ""
      ).toLowerCase();

    if (
      !hostname.includes(
        "digitaloceanspaces.com"
      )
    ) {
      return "";
    }

    let key =
      decodeURIComponent(
        parsed.pathname ||
          ""
      ).replace(
        /^\/+/,
        ""
      );

    /*
     * Path Style:
     * sgp1.digitaloceanspaces.com/hw1/Branches/xxx.jpg
     */

    if (
      key.startsWith(
        "hw1/"
      )
    ) {
      key =
        key.slice(
          "hw1/".length
        );
    }
    return key;
  } catch {
    return "";
  }
}

/* =========================================================
   Blob -> Data URL
========================================================= */

async function blobToDataUrl(
  blob
) {
  return await new Promise(
    (
      resolve,
      reject
    ) => {
      const reader =
        new FileReader();
      reader.onloadend =
        () => {
          resolve(
            reader.result
          );
        };
      reader.onerror = reject;
      reader.readAsDataURL(
        blob
      );
    }
  );
}

async function imageUrlToDataUrl(
  url
) {
  if (!url) {
    return null;
  }
  const sourceUrl = String(url).trim();
  if (!sourceUrl) {
    return null;
  }

  /*
   * เป็น Data URL อยู่แล้ว
   */
  if (sourceUrl.startsWith("data:")) {
    return sourceUrl;
  }

  try {
    const spacesKey = getSpacesObjectKey(sourceUrl);

    if (spacesKey) {
      const proxyUrl = `/api/admin/spaces-image?key=${encodeURIComponent(spacesKey)}`;

      const response =
        await fetch(
          proxyUrl,
          {
            method: "GET",
            cache:
              "no-store",
          }
        );

      if (!response.ok) {
        throw new Error(
          `ไม่สามารถโหลดรูปจาก DigitalOcean Spaces ได้ (${response.status})`
        );

      }

      const blob = await response.blob();
      return await blobToDataUrl(
        blob
      );
    }

    const response =
      await fetch(
        sourceUrl,
        {
          mode: "cors",
        }
      );

    if (!response.ok) {
      throw new Error(
        `ไม่สามารถโหลดรูปภาพได้ (${response.status})`
      );
    }

    const blob = await response.blob();
    return await blobToDataUrl(
      blob
    );
  } catch (
    error
  ) {

    console.warn(
      "IMAGE_TO_DATA_URL_FAILED:",
      sourceUrl,
      error
    );

    return null;
  }
}

/* =========================================================
   Prepare Clone
========================================================= */

async function prepareCloneForImageExport(
  sourceElement
) {
  const clone = sourceElement.cloneNode(
      true
    );

  clone
    .querySelectorAll(
      "[data-matrix-no-print]"
    )
    .forEach(
      (node) => {
        node.remove();
      }
    );

  clone
    .querySelectorAll(
      "[data-matrix-scroll]"
    )
    .forEach(
      (node) => {
        node.style.overflow =
          "visible";
      }
    );

  clone.style.width =
    `${sourceElement.scrollWidth}px`;
  clone.style.maxWidth =
    "none";
  clone.style.overflow =
    "visible";
  clone.style.boxShadow =
    "none";

  copyComputedStyles(
    sourceElement,
    clone
  );

  /* =======================================================
     Export branch code / name แบบเต็ม

     copyComputedStyles() จะคัดลอก style จาก DOM จริงมาให้ Clone
     ดังนั้นต้อง override หลัง copyComputedStyles เท่านั้น
     เพื่อไม่ให้ text-overflow: ellipsis กลับมาอีก
  ======================================================= */

  clone
    .querySelectorAll(
      "[data-matrix-branch-code], [data-matrix-branch-name]"
    )
    .forEach((node) => {
      node.style.display =
        "block";

      node.style.width =
        "100%";

      node.style.maxWidth =
        "135px";

      node.style.overflow =
        "visible";

      node.style.textOverflow =
        "clip";

      node.style.whiteSpace =
        "normal";

      node.style.overflowWrap =
        "anywhere";

      node.style.wordBreak =
        "break-word";
    });


  /* =======================================================
     Convert <img> ทั้งหมดเป็น Data URL ก่อนสร้าง SVG
     จุดนี้สำคัญมาก เพราะถ้าปล่อย URL จาก Spaces
     เข้า Canvas โดยตรง Canvas จะถูก taint
  ======================================================= */

  const sourceImages =
    Array.from(
      sourceElement
        .querySelectorAll(
          "img"
        )
    );

  const cloneImages =
    Array.from(
      clone.querySelectorAll(
        "img"
      )
    );

  await Promise.all(
    cloneImages.map(
      async (
        imageNode,
        index
      ) => {
        const sourceImage =
          sourceImages[
            index
          ];

        const sourceUrl =
          sourceImage
            ?.currentSrc ||
          sourceImage?.src;
        if (!sourceUrl) {
          return;
        }

        const dataUrl =
          await imageUrlToDataUrl(
            sourceUrl
          );

        if (dataUrl) {
          imageNode.setAttribute(
            "src",
            dataUrl
          );

          /*
           * เมื่อเปลี่ยนเป็น Data URL แล้ว
           * ไม่ต้องใช้ crossOrigin
           */

          imageNode.removeAttribute(
            "crossorigin"
          );
          return;
        }

        /*
         * ถ้ารูปใดโหลดไม่ได้
         * ให้ซ่อนรูปนั้นแทน
         *
         * ดีกว่าปล่อย External URL
         * เข้า Canvas แล้วทำ Canvas tainted
         */

        imageNode.removeAttribute(
          "src"
        );

        imageNode.style.display =
          "none";
      }
    )
  );
  return clone;
}

async function exportElementToPng({
  element,
  fileName,
  download = true,
}) {

  if (!element) {
    throw new Error(
      "ไม่พบ Element สำหรับ Export"
    );
  }

  /*
   * Clone Matrix ก่อน
   *
   * prepareCloneForImageExport()
   * จะทำหน้าที่:
   * - เอาปุ่มที่ไม่ต้องการออก
   * - เปิด overflow
   * - copy computed styles
   * - แปลงรูป DigitalOcean Spaces เป็น Data URL
   */
  const clone =
    await prepareCloneForImageExport(
      element
    );
  /* =======================================================
     Calculate Export Size
  ======================================================= */

  const width =
    Math.max(
      element.scrollWidth || 0,
      element.offsetWidth || 0,
      element.clientWidth || 0
    );

  const height =
    Math.max(
      element.scrollHeight || 0,
      element.offsetHeight || 0,
      element.clientHeight || 0
    );

  if (
    !width ||
    !height
  ) {
    throw new Error(
      "ไม่สามารถคำนวณขนาดรูปสำหรับ Export ได้"
    );
  }

  /*
   * จำกัดไว้ที่ 2
   * เพื่อไม่ให้ Canvas ใหญ่เกินไป
   * และใช้ Memory สูงเกินจำเป็น
   */

  const pixelRatio =
    Math.min(
      window.devicePixelRatio ||
        2,
      2
    );



  /* =======================================================
     Temporary Export Container
     html-to-image ควรอ่าน Node
     ที่อยู่ใน DOM จริง เพื่อให้ Layout
     และ Computed Size ถูกต้อง
  ======================================================= */

  const exportContainer =
    document.createElement(
      "div"
    );

  exportContainer.setAttribute(
    "data-matrix-export-container",
    "true"
  );



  /*
   * วางออกไปนอกหน้าจอ
   * User จะไม่เห็นระหว่าง Export
   */

  exportContainer.style.position =
    "fixed";
  exportContainer.style.left =
    "-100000px";
  exportContainer.style.top =
    "0";
  exportContainer.style.width =
    `${width}px`;
  exportContainer.style.minWidth =
    `${width}px`;
  exportContainer.style.maxWidth =
    "none";
  exportContainer.style.height =
    "auto";
  exportContainer.style.background =
    "#ffffff";
  exportContainer.style.overflow =
    "visible";
  exportContainer.style.pointerEvents =
    "none";
  exportContainer.style.zIndex =
    "-999999";

  /*
   * ตั้ง Clone ให้แสดงพื้นที่ทั้งหมด
   */

  clone.style.width =
    `${width}px`;
  clone.style.minWidth =
    `${width}px`;
  clone.style.maxWidth =
    "none";
  clone.style.height =
    "auto";
  clone.style.maxHeight =
    "none";
  clone.style.overflow =
    "visible";
  clone.style.boxShadow =
    "none";
  clone.style.transform =
    "none";
  /*
   * ถ้ามี element ที่เป็น Scroll Container
   * เปิดทั้งหมดอีกครั้งเผื่อ Style ที่ Copy มา
   * เขียนทับค่าจาก prepareCloneForImageExport
   */

  clone
    .querySelectorAll(
      "[data-matrix-scroll]"
    )
    .forEach(
      (node) => {
        node.style.overflow =
          "visible";
        node.style.maxHeight =
          "none";
        node.style.height =
          "auto";
      }

    );

  /*
   * ป้องกันปุ่ม Export
   * หรือ Element ที่ระบุว่าไม่ต้องพิมพ์
   * หลุดเข้าไปในรูป
   */

  clone
    .querySelectorAll(
      "[data-matrix-no-print]"
    )
    .forEach(
      (node) => {
        node.remove();
      }
    );

  exportContainer.appendChild(
    clone
  );

  document.body.appendChild(
    exportContainer
  );
  try {
    /* =====================================================
       Wait Layout
       ให้ Browser มีเวลา Calculate Layout
       ของ Clone ที่เพิ่ง Mount
    ===================================================== */
    await new Promise(
      (resolve) => {
        requestAnimationFrame(
          () => {
            requestAnimationFrame(
              resolve
            );
          }
        );
      }
    );
    /*
     * รอ Font ที่ Browser กำลัง Load
     * เฉพาะที่รองรับ document.fonts
     */
    if (
      document.fonts?.ready
    ) {
      try {
        await document.fonts.ready;
      } catch {
        /*
         * ไม่ให้ Font Error
         * ทำ Export ทั้งชุดพัง
         */
      }
    }

    /* =====================================================
       Recalculate Size หลัง Mount
       Clone บางกรณีอาจสูงขึ้น
       หลังเปิด Scroll / Render Font
    ===================================================== */

    const exportWidth =
      Math.max(
        width,
        clone.scrollWidth || 0,
        clone.offsetWidth || 0,
        exportContainer.scrollWidth ||
          0
      );

    const exportHeight =
      Math.max(
        height,
        clone.scrollHeight || 0,
        clone.offsetHeight || 0,
        exportContainer.scrollHeight ||
          0
      );
    /* =====================================================
       html-to-image
       สำคัญ:
       ตรงนี้เราไม่สร้าง
       SVG -> Canvas -> toDataURL เองแล้ว
       รูปจาก Spaces ถูกแปลง Data URL
       ใน prepareCloneForImageExport()
       ก่อนเข้าจุดนี้แล้ว
    ===================================================== */

    const pngUrl =
      await toPng(
        clone,
        {
          /*
           * Background
           */
          backgroundColor:
            "#ffffff",
          /*
           * Quality / Resolution
           */
          pixelRatio,
          /*
           * Export พื้นที่จริงทั้งหมด
           */
          width:
            exportWidth,
          height:
            exportHeight,
          /*
           * บังคับ Size ให้ Node ตอน Render
           */
          style: {
            width:
              `${exportWidth}px`,
            minWidth:
              `${exportWidth}px`,
            maxWidth:
              "none",
            height:
              "auto",
            maxHeight:
              "none",
            overflow:
              "visible",
            transform:
              "none",
            background:
              "#ffffff",
          },

          /*
           * ป้องกัน Browser Cache
           * ของ Resource เก่าที่อาจไม่มี CORS
           */
          cacheBust:
            true,
          /*
           * Font ภายนอกไม่จำเป็นสำหรับการ Export
           * ช่วยลด Resource ภายนอกที่อาจทำ Canvas tainted
           */
          skipFonts:
            true,
          /*
           * เผื่อ Component อื่นถูกเพิ่มภายหลัง
           * แล้วมี data-matrix-no-print
           */
          filter: (
            node
          ) => {
            if (
              node instanceof
                HTMLElement &&
              node.hasAttribute(
                "data-matrix-no-print"
              )
            ) {
              return false;
            }
            return true;
          },
        }
      );

    /* =====================================================
       Validate Result
    ===================================================== */

    if (
      !pngUrl ||
      !String(
        pngUrl
      ).startsWith(
        "data:image/png"
      )
    ) {
      throw new Error(
        "ไม่สามารถสร้างข้อมูลรูป PNG ได้"
      );
    }

    /* =====================================================
       Download PNG
    ===================================================== */

    if (download) {
      const link =
        document.createElement(
          "a"
        );

      link.href =
        pngUrl;

      link.download =
        `${sanitizeFileName(
          fileName
        )}.png`;

      link.style.display =
        "none";

      document.body.appendChild(
        link
      );

      link.click();
      link.remove();
    }

    /*
     * คืน PNG ชุดเดียวกันให้ Download PDF ใช้ต่อ
     * เพื่อให้ PDF มีหน้าตาเหมือนรูป PNG ทุกจุด
     */
    return {
      pngUrl,
      width:
        exportWidth,
      height:
        exportHeight,
    };
  } finally {

    /*
     * Cleanup Clone
     * ไม่ให้ค้างอยู่ใน DOM
     */
    exportContainer.remove();
  }
}


/* =========================================================
   Export PDF

   ใช้ PNG Render ชุดเดียวกับ Download Image
   แล้วสร้าง PDF 1 หน้า ด้วย Browser API โดยตรง
   ไม่ใช้ jsPDF และไม่ต้องติดตั้ง package เพิ่ม
========================================================= */

function dataUrlToUint8Array(
  dataUrl
) {
  const source =
    String(
      dataUrl || ""
    );

  const commaIndex =
    source.indexOf(",");

  if (
    commaIndex < 0
  ) {
    throw new Error(
      "รูปแบบ Data URL ไม่ถูกต้อง"
    );
  }

  const base64 =
    source.slice(
      commaIndex + 1
    );

  const binary =
    window.atob(
      base64
    );

  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let index = 0;
    index <
    binary.length;
    index += 1
  ) {
    bytes[index] =
      binary.charCodeAt(
        index
      );
  }

  return bytes;
}

async function pngDataUrlToJpeg(
  pngUrl
) {
  const image =
    await new Promise(
      (
        resolve,
        reject
      ) => {
        const img =
          new Image();

        img.onload =
          () =>
            resolve(
              img
            );

        img.onerror =
          () =>
            reject(
              new Error(
                "ไม่สามารถเตรียมรูปสำหรับ PDF ได้"
              )
            );

        img.src =
          pngUrl;
      }
    );

  const width =
    Number(
      image.naturalWidth ||
        image.width ||
        0
    );

  const height =
    Number(
      image.naturalHeight ||
        image.height ||
        0
    );

  if (
    !width ||
    !height
  ) {
    throw new Error(
      "ไม่สามารถอ่านขนาดรูปสำหรับ PDF ได้"
    );
  }

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    width;

  canvas.height =
    height;

  const ctx =
    canvas.getContext(
      "2d"
    );

  if (!ctx) {
    throw new Error(
      "ไม่สามารถสร้าง Canvas สำหรับ PDF ได้"
    );
  }

  /*
   * PDF ใช้ JPEG /DeviceRGB
   * เติมพื้นขาวก่อนเพื่อป้องกันพื้นโปร่งใสกลายเป็นสีดำ
   */
  ctx.fillStyle =
    "#ffffff";

  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  ctx.drawImage(
    image,
    0,
    0,
    width,
    height
  );

  const jpegUrl =
    canvas.toDataURL(
      "image/jpeg",
      0.98
    );

  return {
    jpegUrl,
    width,
    height,
  };
}

function createPdfBlobFromJpeg({
  jpegUrl,
  imageWidth,
  imageHeight,
  pageWidth,
  pageHeight,
}) {
  const jpegBytes =
    dataUrlToUint8Array(
      jpegUrl
    );

  const encoder =
    new TextEncoder();

  const parts = [];
  const offsets = [
    0,
  ];

  let byteLength = 0;

  const pushText =
    (value) => {
      const bytes =
        encoder.encode(
          String(value)
        );

      parts.push(
        bytes
      );

      byteLength +=
        bytes.length;
    };

  const pushBytes =
    (bytes) => {
      parts.push(
        bytes
      );

      byteLength +=
        bytes.length;
    };

  const formatNumber =
    (value) => {
      const number =
        Number(value);

      if (
        !Number.isFinite(
          number
        )
      ) {
        return "0";
      }

      return number
        .toFixed(4)
        .replace(
          /\.?0+$/,
          ""
        );
    };

  const pdfWidth =
    formatNumber(
      pageWidth
    );

  const pdfHeight =
    formatNumber(
      pageHeight
    );

  /* =======================================================
     PDF Header
  ======================================================= */

  pushText(
    "%PDF-1.4\n"
  );

  /* =======================================================
     1. Catalog
  ======================================================= */

  offsets[1] =
    byteLength;

  pushText(
    `1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
`
  );

  /* =======================================================
     2. Pages
  ======================================================= */

  offsets[2] =
    byteLength;

  pushText(
    `2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
`
  );

  /* =======================================================
     3. Page
  ======================================================= */

  offsets[3] =
    byteLength;

  pushText(
    `3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 ${pdfWidth} ${pdfHeight}]
/Resources <<
  /XObject <<
    /Im0 4 0 R
  >>
>>
/Contents 5 0 R
>>
endobj
`
  );

  /* =======================================================
     4. JPEG Image
  ======================================================= */

  offsets[4] =
    byteLength;

  pushText(
    `4 0 obj
<<
/Type /XObject
/Subtype /Image
/Width ${Math.max(
      Math.round(
        imageWidth
      ),
      1
    )}
/Height ${Math.max(
      Math.round(
        imageHeight
      ),
      1
    )}
/ColorSpace /DeviceRGB
/BitsPerComponent 8
/Filter /DCTDecode
/Length ${jpegBytes.length}
>>
stream
`
  );

  pushBytes(
    jpegBytes
  );

  pushText(
    `
endstream
endobj
`
  );

  /* =======================================================
     5. Page Content
  ======================================================= */

  const content =
    `q
${pdfWidth} 0 0 ${pdfHeight} 0 0 cm
/Im0 Do
Q
`;

  const contentBytes =
    encoder.encode(
      content
    );

  offsets[5] =
    byteLength;

  pushText(
    `5 0 obj
<<
/Length ${contentBytes.length}
>>
stream
`
  );

  pushBytes(
    contentBytes
  );

  pushText(
    `
endstream
endobj
`
  );

  /* =======================================================
     XRef
  ======================================================= */

  const xrefOffset =
    byteLength;

  pushText(
    `xref
0 6
0000000000 65535 f 
`
  );

  for (
    let objectIndex = 1;
    objectIndex <= 5;
    objectIndex += 1
  ) {
    pushText(
      `${String(
        offsets[
          objectIndex
        ]
      ).padStart(
        10,
        "0"
      )} 00000 n \n`
    );
  }

  /* =======================================================
     Trailer
  ======================================================= */

  pushText(
    `trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
${xrefOffset}
%%EOF`
  );

  return new Blob(
    parts,
    {
      type:
        "application/pdf",
    }
  );
}

function downloadBlob(
  blob,
  fileName
) {
  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href =
    url;

  link.download =
    fileName;

  link.style.display =
    "none";

  document.body.appendChild(
    link
  );

  try {
    link.click();
  } finally {
    link.remove();

    window.setTimeout(
      () => {
        URL.revokeObjectURL(
          url
        );
      },
      1000
    );
  }
}

async function exportElementToPdf({
  element,
  fileName,
}) {
  /*
   * ใช้ Render ชุดเดียวกับ Download Image
   * เพื่อให้ PDF มีหน้าตาเหมือน PNG
   */
  const rendered =
    await exportElementToPng({
      element,
      fileName,
      download:
        false,
    });

  const pngUrl =
    rendered?.pngUrl;

  const width =
    Number(
      rendered?.width ||
        0
    );

  const height =
    Number(
      rendered?.height ||
        0
    );

  if (
    !pngUrl ||
    !width ||
    !height
  ) {
    throw new Error(
      "ไม่สามารถเตรียมข้อมูลสำหรับ PDF ได้"
    );
  }

  /*
   * Browser Layout ใช้ px
   * PDF ใช้ pt
   *
   * 96 px = 72 pt
   */
  const pxToPt =
    72 / 96;

  const pdfWidth =
    Math.max(
      width *
        pxToPt,
      1
    );

  const pdfHeight =
    Math.max(
      height *
        pxToPt,
      1
    );

  /*
   * PDF มาตรฐานสามารถฝัง JPEG ได้โดยตรง
   * จึงแปลง PNG ที่ Render สำเร็จแล้วเป็น JPEG
   * โดยไม่เพิ่ม dependency ใหม่
   */
  const jpeg =
    await pngDataUrlToJpeg(
      pngUrl
    );

  const pdfBlob =
    createPdfBlobFromJpeg({
      jpegUrl:
        jpeg.jpegUrl,

      imageWidth:
        jpeg.width,

      imageHeight:
        jpeg.height,

      pageWidth:
        pdfWidth,

      pageHeight:
        pdfHeight,
    });

  downloadBlob(
    pdfBlob,
    `${sanitizeFileName(
      fileName
    )}.pdf`
  );
}

export default function DepartmentMatrixPdfExport({disabled = false,}) {

  const [exportingPdf,setExportingPdf,] = useState(false);
  const [exportingImage,setExportingImage,] = useState(false);
  const exportBaseName = `business-structure-departments-${getLocalDateStamp()}`;

  const handleExportPdf =
    async () => {
      if (
        disabled ||
        exportingPdf ||
        typeof window ===
          "undefined" ||
        typeof document ===
          "undefined"
      ) {
        return;
      }

      const exportRoot =
        document.getElementById(
          "department-matrix-print-root"
        );

      if (!exportRoot) {
        return;
      }

      try {
        setExportingPdf(
          true
        );

        await exportElementToPdf({
          element:
            exportRoot,

          fileName:
            exportBaseName,
        });
      } catch (
        error
      ) {
        console.error(
          "Export PDF failed:",
          error
        );

        window.alert(
          "ไม่สามารถดาวน์โหลด PDF ได้ กรุณาลองใหม่อีกครั้ง"
        );
      } finally {
        setExportingPdf(
          false
        );
      }
    };

  const handleExportImage = async () => {
    if (
      disabled ||
      exportingImage ||
      typeof window ===
        "undefined" ||
      typeof document ===
        "undefined"
    ) {
      return;
    }
    const exportRoot =
      document.getElementById(
        "department-matrix-print-root"
      );
    if (!exportRoot) {
      return;
    }
    try {
      setExportingImage(true);
      await exportElementToPng({
        element:
          exportRoot,
        fileName:
          exportBaseName,
      });
    } catch (
      error
    ) {
      console.error(
        "Export image failed:",
        error
      );
      window.alert(
        "ไม่สามารถดาวน์โหลดรูปได้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setExportingImage(
        false
      );
    }
  };

  return (
    <div
      className="
        flex
        flex-wrap
        items-center
        justify-end
        gap-2
      "
    >
      {/* ===============================================
          Download PNG
      =============================================== */}
      <button
        type="button"
        onClick={
          handleExportImage
        }
        disabled={
          disabled ||
          exportingImage ||
          exportingPdf
        }
        data-matrix-no-print
        title="ดาวน์โหลด Matrix View เป็นรูป PNG"
        className="
          inline-flex
          items-center
          gap-2
          rounded-xl
          border
          border-sky-200
          bg-white
          px-4
          py-2
          text-sm
          font-semibold
          text-sky-700
          shadow-sm
          transition
          hover:border-sky-300
          hover:bg-sky-50
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        {exportingImage ? (
          <DownloadOutlined />
        ) : (
          <PictureOutlined />
        )}
        {exportingImage
          ? "Preparing Image..."
          : "Download Image"}
      </button>


      {/* ===============================================
          Download PDF
      =============================================== */}
      <button
        type="button"
        onClick={
          handleExportPdf
        }
        disabled={
          disabled ||
          exportingPdf ||
          exportingImage
        }
        data-matrix-no-print
        title="ดาวน์โหลด Matrix View เป็น PDF"
        className="
          inline-flex
          items-center
          gap-2
          rounded-xl
          border
          border-red-200
          bg-white
          px-4
          py-2
          text-sm
          font-semibold
          text-red-600
          shadow-sm
          transition
          hover:border-red-300
          hover:bg-red-50
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        <FilePdfOutlined />

        {exportingPdf
          ? "Preparing PDF..."
          : "Download PDF"}
      </button>
    </div>
  );
}