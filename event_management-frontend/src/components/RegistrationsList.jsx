export default function RegistrationsList({
  visibleRegistrations,
  users,
  isAdmin,
  isOrganizer,
  selectedEvent,
  currentUser,
  cancelRegistration
}) {
  return (
    <section className="card">
      <h2>Prijave i lista čekanja</h2>

      {visibleRegistrations.length === 0 && (
        <p className="muted">Nema prijava.</p>
      )}

      {visibleRegistrations.length > 0 && (
        <table>
          <tbody>
            {visibleRegistrations.map(r => {
              const user = users.find(u => u.id === r.userId);
              const canCancel =
                isAdmin ||
                (isOrganizer && selectedEvent?.organizerId === currentUser.userId);

              return (
                <tr key={r.id}>
                  <td>{user?.username || r.userId}</td>

                  <td>
                    <span className={"status " + r.status.toLowerCase()}>
                      {r.status}
                    </span>
                  </td>

                  <td>
                    {r.status !== "CANCELLED" && canCancel ? (
                      <button
                        className="danger"
                        onClick={() => cancelRegistration(r.userId)}
                      >
                        Otkaži
                      </button>
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
