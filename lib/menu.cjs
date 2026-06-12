const prompts = require("prompts");

const onCancel = () => {
  console.log("\nHasta luego.");
  process.exit(0);
};

const mainMenu = async () => {
  const { value } = await prompts(
    {
      type: "select",
      name: "value",
      message: "¿Qué querés hacer?",
      choices: [
        { title: "📄 Análisis de código", value: "code" },
        { title: "🎬 Análisis multimedia", value: "media" },
        { title: "Salir", value: "exit" },
      ],
    },
    { onCancel }
  );
  return value;
};

const submenu = async (category) => {
  const choices =
    category === "code"
      ? [
          { title: "Generar bundle", value: "generate" },
          { title: "Dividir markdown", value: "split" },
          { title: "Pipeline completo (generate + split)", value: "generate-split" },
          { title: "← Volver", value: "back" },
        ]
      : [
          { title: "Descargar video", value: "download" },
          { title: "Dividir video", value: "split-video" },
          { title: "Transcribir partes", value: "transcript" },
          { title: "Pipeline completo (download + split + transcript)", value: "pipeline" },
          { title: "← Volver", value: "back" },
        ];

  const { value } = await prompts(
    { type: "select", name: "value", message: "Seleccionar operación", choices },
    { onCancel }
  );
  return value;
};

const askVar = async (label) => {
  const { value } = await prompts(
    {
      type: "text",
      name: "value",
      message: label,
      initial: "",
    },
    { onCancel }
  );
  return value;
};

module.exports = { mainMenu, submenu, askVar };
