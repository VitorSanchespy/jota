import React, { useState } from "react";

const ProcessUpdateForm = ({ process, onSubmit }) => {
  const [details, setDetails] = useState(process?.details || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...process, details });
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={details}
        onChange={e => setDetails(e.target.value)}
        placeholder="Atualize os detalhes do processo"
      />
      <button type="submit">Salvar Atualização</button>
    </form>
  );
};

export default ProcessUpdateForm;