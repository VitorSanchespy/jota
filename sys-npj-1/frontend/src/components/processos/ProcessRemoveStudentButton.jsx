import React from "react";

const ProcessRemoveStudentButton = ({ onRemove, disabled }) => (
  <button onClick={onRemove} disabled={disabled} style={{ color: "red" }}>
    Remover aluno
  </button>
);

export default ProcessRemoveStudentButton;