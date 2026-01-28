import { useStore } from '../store';

export function GroupingSelector() {
  const { currentGrouping, setGrouping } = useStore();

  const currentType = currentGrouping.type;

  return (
    <div className="grouping-selector">
      <label>Group by:</label>
      <select
        value={currentType}
        onChange={(e) => {
          const value = e.target.value as 'none' | 'project' | 'area';
          setGrouping({ type: value });
        }}
      >
        <option value="none">None</option>
        <option value="project">Project</option>
        <option value="area">Area</option>
      </select>
    </div>
  );
}
