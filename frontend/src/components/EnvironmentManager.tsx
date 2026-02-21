import React from "react";
import { FaEye, FaEyeSlash, FaPlus, FaTrash } from "react-icons/fa";
import { shallow } from "zustand/shallow";
import {
  useRequests,
  type EnvironmentVariable,
} from "../hooks/useRequests";
import Modal from "./Modal";
import ConfirmModal from "./ConfirmModal";
import Dropdown from "./Dropdown";

const createEmptyVariable = (): EnvironmentVariable => ({
  id: crypto.randomUUID(),
  key: "",
  value: "",
  isSecret: false,
});

export default function EnvironmentManager() {
  const [showSecrets, setShowSecrets] = React.useState(false);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showRenameModal, setShowRenameModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [createEnvironmentName, setCreateEnvironmentName] = React.useState("New Environment");
  const [renameEnvironmentName, setRenameEnvironmentName] = React.useState("");

  const {
    environments,
    activeEnvironmentId,
    setActiveEnvironment,
    createEnvironment,
    renameEnvironment,
    deleteEnvironment,
    upsertEnvironmentVariable,
    deleteEnvironmentVariable,
  } = useRequests(
    (state) => ({
      environments: state.environments,
      activeEnvironmentId: state.activeEnvironmentId,
      setActiveEnvironment: state.setActiveEnvironment,
      createEnvironment: state.createEnvironment,
      renameEnvironment: state.renameEnvironment,
      deleteEnvironment: state.deleteEnvironment,
      upsertEnvironmentVariable: state.upsertEnvironmentVariable,
      deleteEnvironmentVariable: state.deleteEnvironmentVariable,
    }),
    shallow
  );

  const activeEnvironment =
    environments.find((entry) => entry.id === activeEnvironmentId) ||
    environments[0] ||
    null;

  if (!activeEnvironment) return null;

  const handleCreateEnvironment = () => {
    setCreateEnvironmentName("New Environment");
    setShowCreateModal(true);
  };

  const handleRenameEnvironment = () => {
    setRenameEnvironmentName(activeEnvironment.name);
    setShowRenameModal(true);
  };

  const handleDeleteEnvironment = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmCreateEnvironment = () => {
    createEnvironment(createEnvironmentName);
    setShowCreateModal(false);
  };

  const handleConfirmRenameEnvironment = () => {
    renameEnvironment(activeEnvironment.id, renameEnvironmentName);
    setShowRenameModal(false);
  };

  const handleConfirmDeleteEnvironment = () => {
    deleteEnvironment(activeEnvironment.id);
    setShowDeleteModal(false);
  };

  const handleVariablePatch = (
    variableId: string,
    patch: Partial<EnvironmentVariable>
  ) => {
    const target = activeEnvironment.variables.find(
      (entry) => entry.id === variableId
    );
    if (!target) return;
    upsertEnvironmentVariable(activeEnvironment.id, { ...target, ...patch });
  };

  return (
    <>
      <div className="mb-3 rounded-2xl border border-slate-200/70 bg-white/45 p-3 shadow-sm backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/45">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Environment Variables
        </div>
        <button
          type="button"
          onClick={() => setShowSecrets((prev) => !prev)}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white/85 px-2 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/85 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          {showSecrets ? <FaEyeSlash size={11} /> : <FaEye size={11} />}
          {showSecrets ? "Hide Secrets" : "Show Secrets"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <Dropdown
          value={activeEnvironment.id}
          onChange={setActiveEnvironment}
          options={environments.map((environment) => ({
            value: environment.id,
            label: environment.name,
          }))}
          ariaLabel="Select environment"
        />
        <button
          type="button"
          onClick={handleCreateEnvironment}
          className="rounded-lg border border-cyan-400/60 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-500/20 dark:text-cyan-300"
        >
          New
        </button>
        <button
          type="button"
          onClick={handleRenameEnvironment}
          className="rounded-lg border border-slate-300 bg-white/85 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          Rename
        </button>
        <button
          type="button"
          onClick={handleDeleteEnvironment}
          className="rounded-lg border border-rose-400/60 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-500/20 dark:text-rose-300"
        >
          Delete
        </button>
      </div>

      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
        Use <code>{"{{variable_name}}"}</code> in URL, Params, Auth, Headers, and Body.
      </p>

      <div className="mt-3 space-y-2">
        {activeEnvironment.variables.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300/80 px-3 py-2 text-xs text-slate-500 dark:border-slate-600 dark:text-slate-400">
            No variables yet. Add your first variable below.
          </div>
        ) : (
          activeEnvironment.variables.map((variable) => (
            <div
              key={variable.id}
              className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]"
            >
              <input
                value={variable.key}
                onChange={(event) =>
                  handleVariablePatch(variable.id, { key: event.target.value })
                }
                placeholder="key (example: base_url)"
                className="w-full rounded-lg border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
              />
              <input
                type={variable.isSecret && !showSecrets ? "password" : "text"}
                value={variable.value}
                onChange={(event) =>
                  handleVariablePatch(variable.id, { value: event.target.value })
                }
                placeholder={variable.isSecret ? "secret value" : "value"}
                autoComplete="off"
                className="w-full rounded-lg border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() =>
                  handleVariablePatch(variable.id, { isSecret: !variable.isSecret })
                }
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  variable.isSecret
                    ? "border border-amber-400/60 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
                    : "border border-slate-300 bg-white/85 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {variable.isSecret ? "Secret" : "Public"}
              </button>
              <button
                type="button"
                onClick={() =>
                  deleteEnvironmentVariable(activeEnvironment.id, variable.id)
                }
                className="inline-flex items-center justify-center rounded-lg border border-rose-400/60 bg-rose-500/10 px-3 py-2 text-rose-700 transition hover:bg-rose-500/20 dark:text-rose-300"
                aria-label={`Delete variable ${variable.key || "row"}`}
              >
                <FaTrash size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={() =>
          upsertEnvironmentVariable(activeEnvironment.id, createEmptyVariable())
        }
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300"
      >
        <FaPlus size={11} />
        Add Variable
      </button>
      </div>

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Environment"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="rounded-lg border border-white/45 bg-white/30 px-4 py-2 text-sm font-medium text-slate-700 transition duration-200 ease-in-out hover:bg-white/45 dark:border-slate-400/50 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmCreateEnvironment}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition duration-200 ease-in-out hover:bg-emerald-700"
            >
              Create
            </button>
          </>
        }
      >
        <label
          htmlFor="environment-create-name"
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"
        >
          Environment Name
        </label>
        <input
          id="environment-create-name"
          value={createEnvironmentName}
          onChange={(event) => setCreateEnvironmentName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleConfirmCreateEnvironment();
            }
          }}
          className="w-full rounded-lg border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
          placeholder="New Environment"
        />
      </Modal>

      <Modal
        open={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        title="Rename Environment"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowRenameModal(false)}
              className="rounded-lg border border-white/45 bg-white/30 px-4 py-2 text-sm font-medium text-slate-700 transition duration-200 ease-in-out hover:bg-white/45 dark:border-slate-400/50 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmRenameEnvironment}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition duration-200 ease-in-out hover:bg-emerald-700"
            >
              Save
            </button>
          </>
        }
      >
        <label
          htmlFor="environment-rename-name"
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"
        >
          Environment Name
        </label>
        <input
          id="environment-rename-name"
          value={renameEnvironmentName}
          onChange={(event) => setRenameEnvironmentName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleConfirmRenameEnvironment();
            }
          }}
          className="w-full rounded-lg border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
          placeholder="Environment name"
        />
      </Modal>

      <ConfirmModal
        open={showDeleteModal}
        title="Delete Environment"
        description={`Delete environment "${activeEnvironment.name}"?`}
        confirmText="Delete"
        danger
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDeleteEnvironment}
      />
    </>
  );
}
