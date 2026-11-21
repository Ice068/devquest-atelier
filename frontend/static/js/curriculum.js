/**
 * DevQuest Atelier — 12 HTML Lessons + 2 Boss Citadels + SOLO Taxonomy 5-Level Hints
 */

function parseHTML(code) {
  return new DOMParser().parseFromString(code || "", "text/html");
}

function makeSoloHints(concept, singleTag, pairDesc, relationDesc, diagram, extendedTip) {
  return [
    {
      level: "Pre-structural",
      labelTh: "1. เริ่มจับแนวคิดหลัก",
      hint: `ภารกิจนี้เกี่ยวกับ "${concept}" — ลองจินตนาการว่าถ้าคุณจัดหน้ากระดาษนิตยสาร ส่วนนี้ทำหน้าที่อะไรต่อผู้อ่าน?`,
      diagram,
    },
    {
      level: "Uni-structural",
      labelTh: "2. องค์ประกอบเดี่ยวชิ้นแรก",
      hint: `เริ่มจากวางแท็กหลักเพียง 1 ชิ้นก่อน เช่นกลุ่ม ${singleTag} แล้วลองดูผลลัพธ์ใน Live Browser ทางขวา`,
      diagram: "",
    },
    {
      level: "Multi-structural",
      labelTh: "3. ประกอบหลายชิ้นเข้าด้วยกัน",
      hint: `เมื่อชิ้นแรกแสดงผลแล้ว ให้เพิ่มองค์ประกอบร่วม: ${pairDesc} โดยตรวจว่าแท็กเปิดและปิดครบคู่`,
      diagram: "",
    },
    {
      level: "Relational",
      labelTh: "4. เชื่อมความสัมพันธ์ของโครงสร้าง",
      hint: `${relationDesc} — ลองสลับไปดูแท็บ "DOM X-Ray" เพื่อเช็กความลึก (Nesting) ของแท็ก`,
      diagram: "",
    },
    {
      level: "Extended Abstract",
      labelTh: "5. ยกระดับสู่มาตรฐานมืออาชีพ",
      hint: extendedTip,
      diagram: "",
    },
  ];
}

export const QUESTS = [
  {
    id: "lesson-1",
    index: 1,
    act: "Act I · Foundations",
    title: "โครงกระดูกหน้าเว็บแรก",
    subtitle: "Headings & Paragraphs",
    type: "lesson",
    exp: 80,
    x: 80,
    y: 110,
    requiredTags: ["h1", "p"],
    snippets: ["<h1></h1>", "<p></p>", "<hr>"],
    brief:
      "ทุกหน้าเว็บเริ่มต้นจากลำดับชั้นของข้อความ สร้างพาดหัวหลัก (h1) และย่อหน้าแนะนำตัว (p) เพื่อเปิดสมุดบันทึกนักพัฒนาของคุณ",
    starterCode: `<!-- ภารกิจ 01: สร้างพาดหัวหลักและย่อหน้าแนะนำตัว -->\n`,
    checks: [
      {
        label: "มีพาดหัวหลัก <h1> พร้อมข้อความอย่างน้อย 3 ตัวอักษร",
        test: (code) => {
          const el = parseHTML(code).querySelector("h1");
          return Boolean(el && el.textContent.trim().length >= 3);
        },
      },
      {
        label: "มีย่อหน้า <p> อธิบายเป้าหมายการเรียน HTML",
        test: (code) => {
          const el = parseHTML(code).querySelector("p");
          return Boolean(el && el.textContent.trim().length >= 5);
        },
      },
    ],
    soloHints: makeSoloHints(
      "ลำดับชั้นหัวเรื่องและเนื้อหา",
      "<h1>",
      "จับคู่พาดหัว <h1> กับย่อหน้า <p> ด้านล่าง",
      "<h1> ควรมีเพียง 1 อันเป็นหัวเรื่องใหญ่สุดของหน้า และ <p> ทำหน้าที่ขยายความ",
      "[Document]\n ├── <h1> พาดหัวหลัก\n └── <p>  เนื้อหาย่อหน้า",
      "ลองเพิ่ม <h2> สำหรับหัวข้อย่อยเพื่อให้ Screen Reader ข้ามหัวข้อได้ง่าย"
    ),
  },
  {
    id: "lesson-2",
    index: 2,
    act: "Act I · Foundations",
    title: "ศิลปะการจัดตัวอักษร",
    subtitle: "Typography & Emphasis",
    type: "lesson",
    exp: 90,
    x: 185,
    y: 65,
    requiredTags: ["h2", "strong", "em"],
    snippets: ["<h2></h2>", "<strong></strong>", "<em></em>", "<mark></mark>"],
    brief:
      "การเน้นคำใน HTML ไม่ใช่แค่ความสวยงาม แต่สื่อความสำคัญเชิงความหมาย (Semantics) ให้ทั้งคนและโปรแกรมอ่านหน้าจอเข้าใจ",
    starterCode: `<p>การเขียนเว็บที่ดีต้องเริ่มจากโครงสร้างที่ชัดเจน</p>\n`,
    checks: [
      { label: "มีหัวข้อรอง <h2>", test: (c) => Boolean(parseHTML(c).querySelector("h2")?.textContent.trim()) },
      { label: "ใช้ <strong> เน้นคำสำคัญ", test: (c) => Boolean(parseHTML(c).querySelector("strong")?.textContent.trim()) },
      { label: "ใช้ <em> เน้นน้ำเสียงคำ", test: (c) => Boolean(parseHTML(c).querySelector("em")?.textContent.trim()) },
    ],
    soloHints: makeSoloHints(
      "การเน้นความหมายของข้อความ",
      "<strong>",
      "ใช้ <h2> เปิดหัวข้อ แล้วแทรก <strong> และ <em> ภายในย่อหน้า",
      "<strong> สื่อถึงความสำคัญสูง ส่วน <em> สื่อถึงการเน้นน้ำเสียง — วางซ้อนไว้ใน <p> ได้เลย",
      "<p>\n  ข้อความปกติ <strong>คำสำคัญ</strong> และ <em>เน้นเสียง</em>\n</p>",
      "หลีกเลี่ยงการใช้ <b> หรือ <i> แทน <strong>/<em> เมื่อต้องการสื่อความหมาย"
    ),
  },
  {
    id: "lesson-3",
    index: 3,
    act: "Act I · Foundations",
    title: "รายการและลำดับขั้น",
    subtitle: "Ordered & Unordered Lists",
    type: "lesson",
    exp: 100,
    x: 295,
    y: 120,
    requiredTags: ["ul", "ol", "li"],
    snippets: ["<ul>\n  <li></li>\n</ul>", "<ol>\n  <li></li>\n</ol>"],
    brief:
      "จัดระเบียบรายการอุปกรณ์ (ไม่เรียงลำดับ) และขั้นตอนภารกิจ (เรียงลำดับ 1-2-3) ด้วยรายการที่ถูกต้องตามโครงสร้าง DOM",
    starterCode: `<h2>เช็กลิสต์ออกเดินทาง</h2>\n`,
    checks: [
      { label: "มีรายการแบบไม่เรียงลำดับ <ul> พร้อม <li> อย่างน้อย 2 ข้อ", test: (c) => parseHTML(c).querySelectorAll("ul > li").length >= 2 },
      { label: "มีรายการแบบเรียงลำดับ <ol> พร้อม <li> อย่างน้อย 2 ข้อ", test: (c) => parseHTML(c).querySelectorAll("ol > li").length >= 2 },
    ],
    soloHints: makeSoloHints(
      "โครงสร้างรายการ Parent-Child",
      "<ul> และ <li>",
      "สร้างทั้ง <ul> (หัวข้อย่อยจุด) และ <ol> (หัวข้อย่อยตัวเลข)",
      "<li> ทุกชิ้นต้องเป็นลูกโดยตรงของ <ul> หรือ <ol> เสมอ",
      "<ul> (กล่องรายการ)\n ├── <li> รายการที่ 1\n └── <li> รายการที่ 2",
      "สังเกตใน DOM X-Ray ว่า <li> ซ้อนอยู่ใต้ <ul>/<ol> อย่างเป็นระเบียบหรือไม่"
    ),
  },
  {
    id: "lesson-4",
    index: 4,
    act: "Act II · Hypermedia",
    title: "ประตูมิติไฮเปอร์ลิงก์",
    subtitle: "Anchors & Navigation",
    type: "lesson",
    exp: 100,
    x: 410,
    y: 70,
    requiredTags: ["nav", "a"],
    snippets: ["<nav></nav>", '<a href="https://example.com" target="_blank" rel="noopener noreferrer"></a>'],
    brief:
      "เว็บเชื่อมโยงกันด้วยไฮเปอร์ลิงก์ สร้างแถบนำทาง <nav> ที่มีลิงก์ปลอดภัยอย่างน้อย 2 ลิงก์",
    starterCode: `<!-- สร้างแถบนำทางที่มีลิงก์อย่างน้อย 2 ลิงก์ -->\n`,
    checks: [
      { label: "มีกล่องนำทาง <nav>", test: (c) => Boolean(parseHTML(c).querySelector("nav")) },
      { label: "มีลิงก์ <a href=\"...\"> ภายใน <nav> อย่างน้อย 2 ลิงก์", test: (c) => parseHTML(c).querySelectorAll("nav a[href]").length >= 2 },
      { label: "มีอย่างน้อย 1 ลิงก์ที่ใส่ข้อความอธิบายชัดเจน", test: (c) => Array.from(parseHTML(c).querySelectorAll("a[href]")).some((a) => a.textContent.trim().length >= 3) },
    ],
    soloHints: makeSoloHints(
      "การเชื่อมโยงและแถบนำทาง",
      "<nav>",
      "ใส่แท็ก <a> ที่มี attribute href ไว้ด้านใน <nav>",
      "เมื่อใช้ target=\"_blank\" ควรใส่ rel=\"noopener noreferrer\" เพื่อป้องกันช่องโหว่ Tabnabbing",
      "<nav>\n ├── <a href=\"#about\">เกี่ยวกับเรา</a>\n └── <a href=\"#work\">ผลงาน</a>\n</nav>",
      "หลีกเลี่ยงข้อความลิงก์ว่า 'คลิกที่นี่' แต่ให้เขียนชื่อปลายทางที่สื่อความหมาย"
    ),
  },
  {
    id: "lesson-5",
    index: 5,
    act: "Act II · Hypermedia",
    title: "ภาพถ่ายและคำบรรยาย",
    subtitle: "Images, Alt & Figures",
    type: "lesson",
    exp: 110,
    x: 525,
    y: 125,
    requiredTags: ["figure", "img", "figcaption"],
    snippets: ["<figure></figure>", '<img src="https://picsum.photos/420/200" alt="คำอธิบายภาพ">', "<figcaption></figcaption>"],
    brief:
      "แทรกภาพประกอบพร้อมคำอธิบาย alt เพื่อ Accessibility และห่อหุ้มด้วย <figure> + <figcaption> แบบนิตยสารมืออาชีพ",
    starterCode: `<!-- แทรกภาพประกอบใน <figure> พร้อม alt และ <figcaption> -->\n`,
    checks: [
      { label: "มีกล่อง <figure>", test: (c) => Boolean(parseHTML(c).querySelector("figure")) },
      { label: "มี <img> ที่ระบุทั้ง src และ alt (ไม่ว่าง)", test: (c) => {
          const img = parseHTML(c).querySelector("figure img");
          return Boolean(img && img.getAttribute("src")?.trim() && img.getAttribute("alt")?.trim());
        }
      },
      { label: "มีคำบรรยายใต้ภาพ <figcaption>", test: (c) => Boolean(parseHTML(c).querySelector("figure figcaption")?.textContent.trim()) },
    ],
    soloHints: makeSoloHints(
      "สื่อภาพและการเข้าถึง (Accessibility)",
      "<img>",
      "วาง <img> และ <figcaption> คู่กันภายใต้ <figure>",
      "<img> เป็น Void Element ไม่ต้องมีแท็กปิด แต่ต้องมี alt เสมอเพื่อให้ผู้พิการทางสายตาเข้าใจภาพ",
      "<figure>\n ├── <img src=\"...\" alt=\"คำอธิบาย\">\n └── <figcaption>คำบรรยายใต้ภาพ</figcaption>\n</figure>",
      "ลองเพิ่ม loading=\"lazy\" ที่ <img> เพื่อช่วยให้หน้าเว็บโหลดเร็วขึ้น"
    ),
  },
  {
    id: "lesson-6",
    index: 6,
    act: "Act II · Hypermedia",
    title: "สถาปัตยกรรม Semantic",
    subtitle: "Header, Main, Article, Footer",
    type: "lesson",
    exp: 120,
    x: 645,
    y: 75,
    requiredTags: ["header", "main", "article", "footer"],
    snippets: ["<header></header>", "<main></main>", "<article></article>", "<footer></footer>"],
    brief:
      "เลิกใช้ <div> ซ้อนกันไม่รู้จบ! วางโครงหน้าเว็บด้วย Semantic Landmarks ที่ทั้ง Search Engine และ Screen Reader หลงรัก",
    starterCode: `<!-- ออกแบบโครงสร้างหน้าเว็บด้วย header, main, article และ footer -->\n`,
    checks: [
      { label: "มี <header> ส่วนหัวหน้าเว็บ", test: (c) => Boolean(parseHTML(c).querySelector("header")) },
      { label: "มี <main> ที่มี <article> อยู่ด้านใน", test: (c) => Boolean(parseHTML(c).querySelector("main article")) },
      { label: "มี <footer> ส่วนท้ายหน้าเว็บ", test: (c) => Boolean(parseHTML(c).querySelector("footer")) },
    ],
    soloHints: makeSoloHints(
      "Semantic Page Landmarks",
      "<header> และ <main>",
      "แบ่งหน้าออกเป็น 3 โซนหลัก: header → main → footer",
      "วาง <article> ซ้อนอยู่ใน <main> เพื่อระบุว่านี่คือเนื้อหาหลักที่อ่านจบในตัวเอง",
      "<body>\n ├── <header> ชื่อเว็บ\n ├── <main>\n │    └── <article> บทความหลัก\n └── <footer> ลิขสิทธิ์",
      "เปิดแท็บ DOM X-Ray จะเห็นแท็ก Semantic ไฮไลต์สีเขียวชาร์ทรูสแยกจากแท็กทั่วไปชัดเจน!"
    ),
  },
  {
    id: "boss-1",
    index: 7,
    act: "⚔️ Boss Citadel I",
    title: "BOSS I: กอบกู้พอร์ตโฟลิโอพัง",
    subtitle: "The Broken Portfolio Citadel",
    type: "boss",
    exp: 250,
    x: 760,
    y: 130,
    requiredTags: ["header", "nav", "main", "article", "img", "footer"],
    snippets: ["<header></header>", "<nav></nav>", "<main></main>", "<article></article>", '<img src="https://picsum.photos/360/160" alt="ผลงาน">', "<footer></footer>"],
    brief:
      "⚔️ พอร์ตโฟลิโอของนักออกแบบถูกไวรัส Div-Soup โจมตี! จงสร้างหน้าพอร์ตโฟลิโอที่สมบูรณ์ด้วย Semantic HTML ทุกข้อที่ผ่านจะลดพลังชีวิต Boss ลง!",
    starterCode: `<!-- BOSS STAGE I: สร้างหน้าพอร์ตโฟลิโอ Semantic ที่สมบูรณ์ -->\n<div>ชื่อของฉัน</div>\n`,
    checks: [
      { label: "⚔️ ตีเกราะ 1: มี <header> พร้อม <h1> และ <nav> ที่มีลิงก์", test: (c) => Boolean(parseHTML(c).querySelector("header h1") && parseHTML(c).querySelector("header nav a[href]")) },
      { label: "⚔️ ตีเกราะ 2: มี <main> ที่มี <article> อย่างน้อย 1 ชิ้น", test: (c) => Boolean(parseHTML(c).querySelector("main article")) },
      { label: "⚔️ ตีเกราะ 3: มีภาพผลงาน <img> พร้อม alt ใน <main>", test: (c) => {
          const img = parseHTML(c).querySelector("main img");
          return Boolean(img && img.getAttribute("src")?.trim() && img.getAttribute("alt")?.trim());
        }
      },
      { label: "⚔️ ปิดฉาก Boss: มี <footer> พร้อมข้อมูลติดต่อหรือลิขสิทธิ์", test: (c) => Boolean(parseHTML(c).querySelector("footer")?.textContent.trim()) },
    ],
    soloHints: makeSoloHints(
      "การบูรณาการ Semantic HTML ทั้งหน้า",
      "<header>",
      "จัดวาง header (ที่มี h1+nav), main (ที่มี article+img) และ footer",
      "เชื่อมทุกโซนเข้าด้วยกันเป็นหน้าพอร์ตโฟลิโอเดียวที่ไม่มีแท็กเปิดค้าง",
      "<header> (h1 + nav)\n<main>   (article + img[alt])\n<footer> (ข้อความท้ายหน้า)",
      "ตรวจ Structure Score ในแท็บ AI Coach ให้ได้เกิน 90 คะแนนเพื่อปราบ Boss ระดับ Extended Abstract!"
    ),
  },
  {
    id: "lesson-7",
    index: 8,
    act: "Act III · Data & Forms",
    title: "ตารางข้อมูลเชิงโครงสร้าง",
    subtitle: "Tables, Thead & Tbody",
    type: "lesson",
    exp: 120,
    x: 685,
    y: 255,
    requiredTags: ["table", "thead", "tbody", "tr", "th", "td"],
    snippets: ["<table></table>", "<thead><tr><th></th></tr></thead>", "<tbody><tr><td></td></tr></tbody>"],
    brief:
      "สร้างตารางคะแนนภารกิจโดยแยกส่วนหัว (thead/th) และส่วนข้อมูล (tbody/td) อย่างชัดเจน",
    starterCode: `<!-- สร้างตารางคะแนนที่มี thead และ tbody -->\n`,
    checks: [
      { label: "มี <table> พร้อม <thead> และ <th> อย่างน้อย 2 คอลัมน์", test: (c) => parseHTML(c).querySelectorAll("table thead th").length >= 2 },
      { label: "มี <tbody> พร้อมแถวข้อมูล <tr> และ <td> อย่างน้อย 2 ช่อง", test: (c) => parseHTML(c).querySelectorAll("table tbody td").length >= 2 },
    ],
    soloHints: makeSoloHints(
      "ตารางข้อมูลแบบมีหัวตาราง",
      "<table>",
      "แบ่งตารางเป็น <thead> สำหรับหัวข้อ และ <tbody> สำหรับข้อมูล",
      "ภายใน <thead> ใช้ <tr> ครอบ <th> ส่วนภายใน <tbody> ใช้ <tr> ครอบ <td>",
      "<table>\n ├── <thead> → <tr> → <th>\n └── <tbody> → <tr> → <td>",
      "ลองเพิ่ม <caption> ไว้บนสุดของ <table> เพื่อตั้งชื่อตารางให้ Screen Reader อ่านได้"
    ),
  },
  {
    id: "lesson-8",
    index: 9,
    act: "Act III · Data & Forms",
    title: "ฟอร์มรับข้อมูลโต้ตอบ",
    subtitle: "Forms, Labels & Inputs",
    type: "lesson",
    exp: 130,
    x: 560,
    y: 300,
    requiredTags: ["form", "label", "input", "button"],
    snippets: ["<form></form>", '<label for="name">ชื่อ</label>', '<input id="name" type="text" required>', '<button type="submit">ส่ง</button>'],
    brief:
      "สร้างฟอร์มสมัครเข้าร่วมกิลด์ที่มี <label> เชื่อมกับ <input> ด้วย for/id และปุ่มส่งข้อมูล",
    starterCode: `<!-- สร้างฟอร์มที่มี label เชื่อมกับ input และปุ่ม submit -->\n`,
    checks: [
      { label: "มี <form>", test: (c) => Boolean(parseHTML(c).querySelector("form")) },
      { label: "มี <label for=\"...\"> ที่จับคู่กับ id ของ <input>", test: (c) => {
          const doc = parseHTML(c);
          const labels = Array.from(doc.querySelectorAll("form label[for]"));
          return labels.some((l) => Boolean(doc.getElementById(l.getAttribute("for"))));
        }
      },
      { label: "มีปุ่ม <button type=\"submit\">", test: (c) => Boolean(parseHTML(c).querySelector('form button[type="submit"], form button:not([type])')) },
    ],
    soloHints: makeSoloHints(
      "ความสัมพันธ์ระหว่าง Label และ Input",
      "<form>",
      "ใส่ <label>, <input> และ <button> ไว้ใน <form>",
      "ค่า for=\"...\" ใน <label> ต้องตรงกับค่า id=\"...\" ใน <input> เป๊ะ ๆ เพื่อให้คลิกชื่อแล้วโฟกัสช่องได้",
      "<form>\n ├── <label for=\"email\">อีเมล</label>\n ├── <input id=\"email\" type=\"email\">\n └── <button type=\"submit\">ส่ง</button>\n</form>",
      "ลองเพิ่ม attribute required หรือ placeholder เพื่อช่วยให้ผู้ใช้กรอกข้อมูลได้ง่ายขึ้น"
    ),
  },
  {
    id: "lesson-9",
    index: 10,
    act: "Act III · Data & Forms",
    title: "การเลือกและกลุ่มข้อมูลฟอร์ม",
    subtitle: "Fieldset, Select & Textarea",
    type: "lesson",
    exp: 130,
    x: 430,
    y: 255,
    requiredTags: ["fieldset", "legend", "select", "option", "textarea"],
    snippets: ["<fieldset><legend></legend></fieldset>", "<select><option></option></select>", "<textarea></textarea>"],
    brief:
      "ยกระดับฟอร์มให้เป็นมืออาชีพด้วยการจัดกลุ่มคำถามด้วย <fieldset> + <legend>, ตัวเลือก <select> และกล่องข้อความ <textarea>",
    starterCode: `<form>\n  <!-- จัดกลุ่มด้วย fieldset + legend -->\n</form>\n`,
    checks: [
      { label: "มี <fieldset> พร้อม <legend>", test: (c) => Boolean(parseHTML(c).querySelector("fieldset legend")?.textContent.trim()) },
      { label: "มี <select> พร้อม <option> อย่างน้อย 2 ตัวเลือก", test: (c) => parseHTML(c).querySelectorAll("select option").length >= 2 },
      { label: "มีกล่องข้อความหลายบรรทัด <textarea>", test: (c) => Boolean(parseHTML(c).querySelector("textarea")) },
    ],
    soloHints: makeSoloHints(
      "การจัดกลุ่มอินพุตในฟอร์มขนาดใหญ่",
      "<fieldset>",
      "เพิ่ม <legend>, <select>/<option> และ <textarea> ภายใน <fieldset>",
      "<legend> ต้องเป็นลูกตัวแรกของ <fieldset> เพื่อเป็นชื่อหัวข้อกลุ่ม",
      "<fieldset>\n ├── <legend>ข้อมูลภารกิจ</legend>\n ├── <select> → <option>...\n └── <textarea>",
      "การแบ่งฟอร์มเป็นกลุ่มด้วย fieldset ช่วยให้ผู้ใช้แป้นพิมพ์นำทางได้สะดวกมาก"
    ),
  },
  {
    id: "lesson-10",
    index: 11,
    act: "Act IV · Modern HTML",
    title: "สื่อมัลติมีเดียสมัยใหม่",
    subtitle: "Audio, Video & Progress",
    type: "lesson",
    exp: 140,
    x: 300,
    y: 305,
    requiredTags: ["section", "progress", "time"],
    snippets: ["<section></section>", '<progress value="75" max="100"></progress>', '<time datetime="2026-11-19">19 พ.ย. 2026</time>'],
    brief:
      "HTML5 มีแท็กบอกความคืบหน้าและเวลาที่เครื่องอ่านเข้าใจได้! สร้างการ์ดสถานะโปรเจกต์ด้วย <section>, <progress> และ <time>",
    starterCode: `<!-- สร้างการ์ดความคืบหน้าด้วย section, progress และ time -->\n`,
    checks: [
      { label: "มี <section>", test: (c) => Boolean(parseHTML(c).querySelector("section")) },
      { label: "มีหลอดความคืบหน้า <progress value=\"...\" max=\"...\">", test: (c) => {
          const p = parseHTML(c).querySelector("progress");
          return Boolean(p && p.hasAttribute("value") && p.hasAttribute("max"));
        }
      },
      { label: "มีแท็กเวลา <time datetime=\"...\">", test: (c) => Boolean(parseHTML(c).querySelector("time[datetime]")) },
    ],
    soloHints: makeSoloHints(
      "แท็กข้อมูลเชิงเวลาและสถานะใน HTML5",
      "<progress>",
      "วาง <h2>, <progress> และ <time> ไว้ใน <section>",
      "ระบุ attribute datetime ใน <time> ในรูปแบบ YYYY-MM-DD เพื่อให้เบราว์เซอร์และบอทอ่านวันเวลาได้แม่นยำ",
      "<section>\n ├── <h2>สถานะภารกิจ</h2>\n ├── <progress value=\"80\" max=\"100\">\n └── <time datetime=\"2026-11-19\">",
      "ลองใช้ <meter> เปรียบเทียบกับ <progress> ใน SimCode Playground เพื่อดูความต่าง!"
    ),
  },
  {
    id: "lesson-11",
    index: 12,
    act: "Act IV · Modern HTML",
    title: "Interactive HTML ไร้ JS",
    subtitle: "Details & Summary Accordions",
    type: "lesson",
    exp: 140,
    x: 175,
    y: 255,
    requiredTags: ["details", "summary", "p"],
    snippets: ["<details>\n  <summary>คำถามที่พบบ่อย</summary>\n  <p>คำตอบ</p>\n</details>"],
    brief:
      "รู้หรือไม่ว่าคุณสร้างกล่องพับเปิด-ปิด (Accordion) ได้ด้วย HTML ล้วน ๆ โดยไม่ต้องเขียน JavaScript แม้แต่บรรทัดเดียว?",
    starterCode: `<!-- สร้างกล่อง FAQ แบบพับเปิด-ปิดด้วย details + summary -->\n`,
    checks: [
      { label: "มี <details> อย่างน้อย 2 กล่อง", test: (c) => parseHTML(c).querySelectorAll("details").length >= 2 },
      { label: "ทุก <details> มี <summary> เป็นหัวข้อ", test: (c) => {
          const list = Array.from(parseHTML(c).querySelectorAll("details"));
          return list.length >= 2 && list.every((d) => Boolean(d.querySelector("summary")?.textContent.trim()));
        }
      },
      { label: "มีเนื้อหาคำตอบ <p> อยู่ภายใน <details>", test: (c) => parseHTML(c).querySelectorAll("details p").length >= 2 },
    ],
    soloHints: makeSoloHints(
      "Native Disclosure Widget",
      "<details>",
      "วาง <summary> และ <p> ไว้ใน <details> จำนวน 2 ชุด",
      "<summary> คือปุ่มที่ผู้ใช้คลิกเพื่อเปิดดูเนื้อหาที่ซ่อนอยู่ด้านใน <details>",
      "<details>\n ├── <summary>คลิกเพื่อเปิด</summary>\n └── <p>คำตอบที่ซ่อนอยู่</p>\n</details>",
      "ลองเติม attribute open ที่ <details open> เพื่อให้กล่องแรกกางออกตั้งแต่เริ่มต้น!"
    ),
  },
  {
    id: "lesson-12",
    index: 13,
    act: "Act IV · Modern HTML",
    title: "อ้างอิง บทความ และ Accessibility",
    subtitle: "Blockquote, Aside & ARIA",
    type: "lesson",
    exp: 160,
    x: 90,
    y: 350,
    requiredTags: ["article", "blockquote", "aside"],
    snippets: ["<article></article>", "<blockquote><p></p><cite></cite></blockquote>", '<aside aria-label="หมายเหตุ"></aside>'],
    brief:
      "สร้างบทความบรรณาธิการที่มีคำคมอ้างอิง <blockquote> และแถบข้อมูลเสริม <aside> พร้อมระบุ aria-label",
    starterCode: `<!-- สร้างบทความที่มี blockquote และ aside[aria-label] -->\n`,
    checks: [
      { label: "มี <article> ที่บรรจุ <blockquote>", test: (c) => Boolean(parseHTML(c).querySelector("article blockquote")?.textContent.trim()) },
      { label: "มี <aside> ที่ระบุ aria-label", test: (c) => Boolean(parseHTML(c).querySelector("aside[aria-label]")?.getAttribute("aria-label")?.trim()) },
    ],
    soloHints: makeSoloHints(
      "เนื้อหาเสริมและ Accessibility Labels",
      "<blockquote>",
      "วาง <blockquote> ใน <article> และเพิ่ม <aside aria-label=\"...\"> คู่กัน",
      "<aside> ใช้สำหรับเนื้อหาที่เกี่ยวข้องทางอ้อม เช่น เกร็ดความรู้ หรือสารบัญข้างบทความ",
      "<article>\n └── <blockquote> คำคม\n<aside aria-label=\"เกร็ดความรู้\">",
      "ARIA ควรใช้เพื่อเสริมความหมายให้ Semantic HTML ไม่ใช่ใช้แทนแท็กมาตรฐาน"
    ),
  },
  {
    id: "boss-2",
    index: 14,
    act: "👑 Final Boss Citadel",
    title: "FINAL BOSS: นิตยสารเว็บสมบูรณ์แบบ",
    subtitle: "The Accessible Magazine Architecture",
    type: "boss",
    exp: 400,
    x: 245,
    y: 405,
    requiredTags: ["header", "main", "article", "table", "form", "details", "footer"],
    snippets: ["<header></header>", "<main></main>", "<article></article>", "<table><thead><tr><th></th></tr></thead><tbody><tr><td></td></tr></tbody></table>", '<form><label for="sub">อีเมล</label><input id="sub" type="email"><button type="submit">สมัคร</button></form>', "<details><summary>FAQ</summary><p>คำตอบ</p></details>", "<footer></footer>"],
    brief:
      "👑 บททดสอบสุดท้ายแห่ง DevQuest Atelier! ผสานทุกศาสตร์ HTML ที่เรียนมาสร้างหน้านิตยสารออนไลน์ที่มีทั้ง Semantic Layout, ตารางข้อมูล, FAQ แบบพับได้ และฟอร์มสมัครรับข่าวสารที่เข้าถึงได้ 100%!",
    starterCode: `<!-- FINAL BOSS: สร้างหน้านิตยสารเว็บที่ครบทั้ง Semantic, Table, FAQ และ Accessible Form -->\n`,
    checks: [
      { label: "👑 Phase 1: มี <header> (พร้อม <h1>) และ <footer>", test: (c) => Boolean(parseHTML(c).querySelector("header h1") && parseHTML(c).querySelector("footer")) },
      { label: "👑 Phase 2: มี <main> ที่บรรจุ <article> และตาราง <table> (มี th+td)", test: (c) => Boolean(parseHTML(c).querySelector("main article") && parseHTML(c).querySelector("table th") && parseHTML(c).querySelector("table td")) },
      { label: "👑 Phase 3: มีกล่อง <details> พร้อม <summary>", test: (c) => Boolean(parseHTML(c).querySelector("details summary")) },
      { label: "👑 Phase 4: มี <form> ที่เชื่อม <label for> กับ <input id> และมีปุ่ม submit", test: (c) => {
          const doc = parseHTML(c);
          const hasPair = Array.from(doc.querySelectorAll("form label[for]")).some((l) => Boolean(doc.getElementById(l.getAttribute("for"))));
          return hasPair && Boolean(doc.querySelector("form button"));
        }
      },
    ],
    soloHints: makeSoloHints(
      "สถาปัตยกรรมหน้าเว็บสมบูรณ์ระดับ Production",
      "<header> + <main> + <footer>",
      "แบ่งเนื้อหาใน <main> เป็นบทความ + ตาราง + details FAQ + ฟอร์มสมัครรับข่าว",
      "ตรวจสอบทุกคู่แท็กเปิด-ปิด และเช็ก DOM X-Ray ให้เห็นลำดับชั้นที่สะอาดตา",
      "<header> h1\n<main>\n ├── <article> + <table>\n ├── <details> + <summary>\n └── <form> (label ↔ input + button)\n<footer>",
      "กดปุ่ม 'วิเคราะห์ด้วย AI Coach' เพื่อรับฟีดแบ็กเชิงลึกก่อนปราบ Final Boss!"
    ),
  },
];

export const SIMCODE_PRESETS = {
  editorial: {
    name: "Editorial Magazine Card",
    code: `<article style="max-width:520px;border:2px solid #161513;padding:20px;border-radius:12px;background:#fffdf9;box-shadow:5px 5px 0 #161513;">
  <header style="border:none;padding:0;margin-bottom:12px;">
    <small style="letter-spacing:0.12em;text-transform:uppercase;color:#ff4d2a;font-weight:800;">ISSUE 04 · WEB CRAFT</small>
    <h1 style="margin:6px 0 0;font-size:1.8rem;">สถาปัตยกรรมของ Semantic HTML</h1>
  </header>
  <p>การเลือกแท็กที่สื่อความหมายทำให้เว็บอ่านง่ายทั้งสำหรับมนุษย์และเครื่องจักร</p>
  <details open>
    <summary style="font-weight:700;cursor:pointer;">ทำไม Semantic ถึงสำคัญ?</summary>
    <p>ช่วยให้ SEO ดีขึ้นและผู้พิการทางสายตาใช้งาน Screen Reader ได้สะดวก</p>
  </details>
</article>`,
  },
  form: {
    name: "Accessible Signup Form",
    code: `<section style="max-width:420px;">
  <h2>สมัครเข้าร่วมเวิร์กชอป HTML</h2>
  <form>
    <label for="fullname">ชื่อ-นามสกุล</label>
    <input id="fullname" type="text" placeholder="เช่น รัศมี นักพัฒนา" required>
    <label for="track">สายที่สนใจ</label>
    <select id="track">
      <option>Frontend Architecture</option>
      <option>Design Engineering</option>
      <option>Accessibility Specialist</option>
    </select>
    <button type="submit">ลงทะเบียนทันที</button>
  </form>
</section>`,
  },
  bento: {
    name: "Data & Progress Bento",
    code: `<main>
  <h1>แดชบอร์ดการเรียนรู้</h1>
  <section>
    <h2>ความคืบหน้า HTML5</h2>
    <progress value="85" max="100" style="width:100%;height:18px;"></progress>
    <p>อัปเดตล่าสุด: <time datetime="2026-11-19">19 พฤศจิกายน 2026</time></p>
  </section>
  <table>
    <thead><tr><th>หัวข้อ</th><th>ระดับ SOLO</th></tr></thead>
    <tbody>
      <tr><td>Semantic Landmarks</td><td>Relational</td></tr>
      <tr><td>Accessible Forms</td><td>Extended Abstract</td></tr>
    </tbody>
  </table>
</main>`,
  },
};
