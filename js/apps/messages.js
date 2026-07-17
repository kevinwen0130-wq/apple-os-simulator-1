import { state, saveState } from "../state.js";
import { $, bind, openApp, showNotice } from "../ui.js";

function ensureConversations() {
  if (!Array.isArray(state.conversations)) {
    state.conversations = [
      { id: "watch", name: "Apple Watch", unread: 1, messages: [{ text: "Apple Watch 已連線。", incoming: true }, { text: "同步測試成功！", incoming: false }] },
      { id: "family", name: "家人", unread: 0, messages: [{ text: "晚餐想吃什麼？", incoming: true }] }
    ];
  }
}

const avatar = (name) => `<span class="ios-avatar">${name.slice(0, 1)}</span>`;

export const messagesApp = {
  title: "訊息",
  open() {
    ensureConversations();
    openApp(this.title, `
      <div class="ios-large-title"><h1>訊息</h1><button id="newConversation" aria-label="新增訊息">□</button></div>
      <label class="ios-search"><span>⌕</span><input id="messageSearch" placeholder="搜尋"></label>
      <div class="ios-conversation-list" id="conversationList">${state.conversations.map((chat) => `
        <div class="ios-conversation" data-search-name="${chat.name.toLowerCase()}">
          <button data-conversation="${chat.id}">${avatar(chat.name)}<div><b>${chat.name}</b><small>${chat.messages.at(-1)?.text || "尚無訊息"}</small></div><time>${chat.unread ? `<i>${chat.unread}</i>` : "›"}</time></button>
          <button data-delete-conversation="${chat.id}" class="ios-swipe-delete">刪除</button>
        </div>`).join("")}</div>`);
    document.querySelectorAll("[data-conversation]").forEach((button) => bind(button, () => this.openChat(button.dataset.conversation)));
    document.querySelectorAll("[data-delete-conversation]").forEach((button) => bind(button, () => {
      state.conversations = state.conversations.filter((chat) => chat.id !== button.dataset.deleteConversation);
      saveState(); this.open();
    }));
    $("messageSearch").addEventListener("input", (event) => {
      const query = event.target.value.trim().toLowerCase();
      document.querySelectorAll("[data-search-name]").forEach((row) => row.hidden = !row.dataset.searchName.includes(query));
    });
    bind($("newConversation"), () => {
      openApp("新增訊息", `<div class="ios-compose-sheet"><label><span>收件人：</span><input id="contactName" placeholder="姓名"></label><div class="ios-empty-chat">新增 iMessage 對話</div><button id="createConversation">建立對話</button></div>`);
      bind($("createConversation"), () => {
        const name = $("contactName").value.trim();
        if (!name) return;
        const chat = { id: crypto.randomUUID(), name, unread: 0, messages: [] };
        state.conversations.unshift(chat); saveState(); this.openChat(chat.id);
      });
    });
  },
  openChat(id) {
    const chat = state.conversations.find((item) => item.id === id);
    if (!chat) return this.open();
    chat.unread = 0; saveState();
    openApp(chat.name, `
      <div class="ios-chat-contact">${avatar(chat.name)}<b>${chat.name}</b><small>iMessage</small></div>
      <div id="messageThread" class="message-thread ios-message-thread">${chat.messages.map(({ text, incoming }) => `<div class="message ${incoming ? "incoming" : ""}">${text}</div>`).join("")}</div>
      <div class="ios-imessage-apps"><button>＋</button><button>📷</button><button>🎙</button></div>
      <div class="sendbox message-composer ios-composer"><input id="messageInput" placeholder="iMessage"><button id="sendMessage">↑</button></div>`);
    const send = () => {
      const text = $("messageInput").value.trim();
      if (!text) return;
      chat.messages.push({ text, incoming: false }); saveState();
      $("messageThread").insertAdjacentHTML("beforeend", `<div class="message">${text}</div>`);
      $("messageInput").value = "";
      $("messageThread").scrollTop = $("messageThread").scrollHeight;
      showNotice(`${chat.name}：${text}`);
    };
    bind($("sendMessage"), send);
    $("messageInput").addEventListener("keydown", (event) => { if (event.key === "Enter") send(); });
    requestAnimationFrame(() => $("messageThread").scrollTop = $("messageThread").scrollHeight);
  }
};
