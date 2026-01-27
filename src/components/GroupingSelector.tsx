import { useStore } from '../store';

export function GroupingSelector() {
  const { attributes, currentGrouping, setGrouping } = useStore();

  const currentId =
    'attributeId' in currentGrouping
      ? currentGrouping.attributeId
      : 'type' in currentGrouping ? currentGrouping.type : 'none';

  return (
    <div className="grouping-selector">
      <label>Group by:</label>
      <select
        value={currentId}
        onChange={(e) => {
          const value = e.target.value;
          if (value === 'none') {
            setGrouping({ type: 'none' });
          } else if (value === 'project') {
            setGrouping({ type: 'project' });
          } else if (value === 'area') {
            setGrouping({ type: 'area' });
          } else {
            setGrouping({ attributeId: value });
          }
        }}
      >
        <option value="none">None</option>
        <option value="project">Project</option>
        <option value="area">Area</option>
        {attributes.map((attr) => (
          <option key={attr.id} value={attr.id}>
            {attr.name}
          </option>
        ))}
      </select>
    </div>
  );
}
