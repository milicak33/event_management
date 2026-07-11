export default function ChatPanel({
  selectedEvent,
  chatMessages,
  currentUser,
  chatForm,
  setChatForm,
  sendChatMessage
}) {
  return (
    <section className="card wide chat-card">
      <h2>Chat događaja</h2>

      {!selectedEvent && (
        <p className="muted">Izaberi događaj da bi videla chat.</p>
      )}

      {selectedEvent && (
        <>
          <div className="chat-layout">
            <div className="chat-intro">
              <h3>{selectedEvent.title}</h3>
              <p className="muted">
                Javne poruke vide svi učesnici događaja. Privatne poruke vide samo
                pošiljalac i organizator događaja.
              </p>
            </div>

            <form className="chat-form" onSubmit={sendChatMessage}>
              <select
                value={chatForm.type}
                onChange={e =>
                  setChatForm({ ...chatForm, type: e.target.value })
                }
              >
                <option value="PUBLIC">Pošalji svima</option>
                <option value="PRIVATE_TO_ORGANIZER">Pošalji samo organizatoru</option>
              </select>

              <textarea
                placeholder="Unesi poruku..."
                value={chatForm.content}
                onChange={e =>
                  setChatForm({ ...chatForm, content: e.target.value })
                }
              />

              <button>Pošalji poruku</button>
            </form>
          </div>

          <div className="chat-box">
            {chatMessages.length === 0 && (
              <p className="muted">Još nema poruka za ovaj događaj.</p>
            )}

            {chatMessages.map(msg => (
              <div
                key={msg.id}
                className={
                  msg.senderId === currentUser.userId
                    ? "chat-message mine"
                    : "chat-message"
                }
              >
                <div className="chat-message-header">
                  <b>{msg.senderUsername}</b>
                  <span className={"status " + msg.type.toLowerCase()}>
                    {msg.type === "PUBLIC" ? "Javno" : "Samo organizatoru"}
                  </span>
                </div>

                <p>{msg.content}</p>

                {msg.sentAt && (
                  <small className="muted">
                    {new Date(msg.sentAt).toLocaleString()}
                  </small>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
