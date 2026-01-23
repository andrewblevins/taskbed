import { useState } from 'react';
import { useStore } from '../store';
import type { AttributeDefinition, AttributeOption } from '../types';

const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
];

interface AttributeOptionItemProps {
  option: AttributeOption;
  attributeId: string;
}

function AttributeOptionItem({ option, attributeId }: AttributeOptionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(option.label);
  const [color, setColor] = useState(option.color || DEFAULT_COLORS[0]);
  const { updateAttribute, attributes } = useStore();

  const attr = attributes.find((a) => a.id === attributeId);
  if (!attr) return null;

  const handleSave = () => {
    if (label.trim()) {
      const newOptions = attr.options.map((o) =>
        o.id === option.id ? { ...o, label: label.trim(), color } : o
      );
      updateAttribute(attributeId, { options: newOptions });
    } else {
      setLabel(option.label);
      setColor(option.color || DEFAULT_COLORS[0]);
    }
    setIsEditing(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${option.label}" option?`)) {
      const newOptions = attr.options.filter((o) => o.id !== option.id);
      updateAttribute(attributeId, { options: newOptions });
    }
  };

  if (isEditing) {
    return (
      <div className="attribute-option-item editing">
        <input
          type="color"
          className="option-color-picker"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <input
          type="text"
          className="option-edit-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setLabel(option.label);
              setColor(option.color || DEFAULT_COLORS[0]);
              setIsEditing(false);
            }
          }}
          autoFocus
        />
      </div>
    );
  }

  return (
    <div className="attribute-option-item" onClick={() => setIsEditing(true)}>
      <span
        className="option-color-dot"
        style={{ backgroundColor: option.color || DEFAULT_COLORS[0] }}
      />
      <span className="option-label">{option.label}</span>
      <button className="option-delete" onClick={handleDelete}>
        ×
      </button>
    </div>
  );
}

interface AttributeItemProps {
  attribute: AttributeDefinition;
}

function AttributeItem({ attribute }: AttributeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(attribute.name);
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const { updateAttribute, deleteAttribute } = useStore();

  const handleSaveName = () => {
    if (name.trim() && name !== attribute.name) {
      updateAttribute(attribute.id, { name: name.trim() });
    } else {
      setName(attribute.name);
    }
    setIsEditingName(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${attribute.name}" attribute and remove from all tasks?`)) {
      deleteAttribute(attribute.id);
    }
  };

  const handleAddOption = () => {
    if (newOptionLabel.trim()) {
      const colorIndex = attribute.options.length % DEFAULT_COLORS.length;
      const newOptions = [
        ...attribute.options,
        {
          id: crypto.randomUUID(),
          label: newOptionLabel.trim(),
          color: DEFAULT_COLORS[colorIndex],
        },
      ];
      updateAttribute(attribute.id, { options: newOptions });
      setNewOptionLabel('');
    }
  };

  return (
    <div className="attribute-item">
      <div className="attribute-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        {isEditingName ? (
          <input
            type="text"
            className="attribute-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onBlur={handleSaveName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveName();
              if (e.key === 'Escape') {
                setName(attribute.name);
                setIsEditingName(false);
              }
            }}
            autoFocus
          />
        ) : (
          <span
            className="attribute-name"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingName(true);
            }}
          >
            {attribute.name}
          </span>
        )}
        <span className="attribute-count">{attribute.options.length} options</span>
        <button className="attribute-delete" onClick={handleDelete}>
          ×
        </button>
      </div>

      {isExpanded && (
        <div className="attribute-options-list">
          {attribute.options.map((opt) => (
            <AttributeOptionItem
              key={opt.id}
              option={opt}
              attributeId={attribute.id}
            />
          ))}
          <div className="add-option">
            <input
              type="text"
              value={newOptionLabel}
              onChange={(e) => setNewOptionLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
              placeholder="New option..."
            />
            <button onClick={handleAddOption}>Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AttributeManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const { attributes, addAttribute } = useStore();

  const handleAdd = () => {
    if (newName.trim()) {
      addAttribute(newName.trim());
      setNewName('');
    }
  };

  if (!isOpen) {
    return (
      <button className="attributes-toggle" onClick={() => setIsOpen(true)}>
        Attributes ({attributes.length})
      </button>
    );
  }

  return (
    <div className="attributes-dropdown">
      <div className="attributes-header">
        <span>Attributes</span>
        <button className="attributes-close" onClick={() => setIsOpen(false)}>
          ×
        </button>
      </div>
      <div className="attributes-list">
        {attributes.map((attr) => (
          <AttributeItem key={attr.id} attribute={attr} />
        ))}
        {attributes.length === 0 && (
          <div className="attributes-empty">No attributes yet</div>
        )}
      </div>
      <div className="attributes-add">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="New attribute..."
        />
        <button onClick={handleAdd}>Add</button>
      </div>
    </div>
  );
}
