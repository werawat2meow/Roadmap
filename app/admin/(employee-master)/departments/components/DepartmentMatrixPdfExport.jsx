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

========================================================= */



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



      reader.onerror =

        reject;



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



  const sourceUrl =

    String(url).trim();



  if (!sourceUrl) {

    return null;

  }



  /*

   * เป็น Data URL อยู่แล้ว

   */

  if (

    sourceUrl.startsWith(

      "data:"

    )

  ) {

    return sourceUrl;

  }



  try {

    const spacesKey =

      getSpacesObjectKey(

        sourceUrl

      );



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



      const blob =

        await response.blob();



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



    const blob =

      await response.blob();



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

  const clone =

    sourceElement.cloneNode(

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

  } finally {

    /*

     * Cleanup Clone

     * ไม่ให้ค้างอยู่ใน DOM

     */

    exportContainer.remove();

  }

}



export default function DepartmentMatrixPdfExport({disabled = false,}) {

  const [exportingPdf,setExportingPdf,] = useState(false);
  const [exportingImage,setExportingImage,] = useState(false);
  const exportBaseName = `business-structure-departments-${getLocalDateStamp()}`;

  const handleExportPdf = () => {
    if (
      disabled ||
      exportingPdf ||
      typeof window ==="undefined") {
      return;
    }
    const previousTitle =
      document.title;
    try {
      setExportingPdf(
        true
      );
      document.title =
        exportBaseName;
      window.print();
    } finally {
      document.title =
        previousTitle;
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
          Export PDF
      =============================================== */}
      {/* <button
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
        title="Export Matrix View เป็น PDF"
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
          : "Export PDF"}
      </button> */}
    </div>
  );
}