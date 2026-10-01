import React from "react";

/**
 * Reusable accessible Toggle Switch component.
 *
 * Usage:
 *   <Toggle
 *     checked={settings.animations}
 *     onChange={(nextValue) => updateSetting("animations", nextValue)}
 *     label="Enable UI Animations"
 *   />
 */
export default function Toggle({
  checked = false,
  onChange,
  label = "Toggle setting",
  disabled = false,
  id
}) {
  const handleToggle = () => {
    if (disabled) return;
    if (typeof onChange === "function") {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={Boolean(checked)}
      aria-label={label}
      disabled={disabled}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={`ui-toggle ${checked ? "is-on" : "is-off"} ${
        disabled ? "is-disabled" : ""
      }`}
    >
      <span className="ui-toggle-track">
        <span className="ui-toggle-thumb" />
      </span>
      <span className="ui-toggle-state-text" aria-hidden="true">
        {checked ? "ON" : "OFF"}
      </span>
    </button>
  );
}
