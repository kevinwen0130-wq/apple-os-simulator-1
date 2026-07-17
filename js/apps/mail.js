import { state, saveState } from "../state.js";
import { $, bind, openApp, showNotice } from "../ui.js";

const starterMail = [
  { id: 1, from: "GitHub", subject: "Pages 網站已部署", body: "你的 Apple OS Simulator 網站已完成部署。", read: false },
  { id: 2, from: "Apple OS Simulator", subject: "歡迎使用新版", body: "相機、天氣、地圖、音樂及郵件功能已準備完成。", read: true }
];

function ensureMail() {
  if (!Array.isArray(state.mail)) state.mail = starterMail;
}

export const mailApp = {
  title: "郵件",
  open() {
    ensureMail();
    openApp(this.title, `
      <div class="mail-toolbar"><b>收件匣</b><button id="composeMail">撰寫</button></div>
      <div class="mail-list">${state.mail.map((mail) => `
        <button class="mail-row ${mail.read ? "" : "unread"}" data-mail="${mail.id}">
          <span>${mail.read ? "" : "●"}</span><div><b>${mail.from}</b><strong>${mail.subject}</strong><small>${mail.body}</small></div>
        </button>`).join("")}</div>`);
    document.querySelectorAll("[data-mail]").forEach((button) => bind(button, () => this.openMessage(Number(button.dataset.mail))));
    bind($("composeMail"), () => this.compose());
  },

  openMessage(id) {
    const mail = state.mail.find((item) => item.id === id);
    if (!mail) return this.open();
    mail.read = true;
    saveState();
    openApp(mail.subject, `
      <div class="mail-message"><small>寄件者</small><b>${mail.from}</b><h3>${mail.subject}</h3><p>${mail.body}</p>
      <button id="replyMail">回覆</button><button id="deleteMail">刪除</button></div>`);
    bind($("replyMail"), () => this.compose(mail.from, `Re: ${mail.subject}`));
    bind($("deleteMail"), () => {
      state.mail = state.mail.filter((item) => item.id !== id);
      saveState(); this.open();
    });
  },

  compose(to = "", subject = "") {
    openApp("新增郵件", `
      <div class="mail-compose">
        <label>收件者<input id="mailTo" type="email" value="${to}" placeholder="name@example.com"></label>
        <label>主旨<input id="mailSubject" value="${subject}" placeholder="郵件主旨"></label>
        <textarea id="mailBody" placeholder="輸入郵件內容"></textarea>
        <button id="sendMail">使用郵件 App 傳送</button>
      </div>`);
    bind($("sendMail"), () => {
      const recipient = $("mailTo").value.trim();
      if (!recipient) return showNotice("請輸入收件者");
      const mailSubject = encodeURIComponent($("mailSubject").value);
      const body = encodeURIComponent($("mailBody").value);
      window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${mailSubject}&body=${body}`;
    });
  }
};
