import { useEffect, useRef } from 'react';
import { DOMAttributes } from 'react';
import { EditableMathField } from 'react-mathquill';

export default function Mathfield({
	latex,
	id,
	onChange,
}: {
	latex?: string;
	id?: string;
	onChange?: (e) => void;
}) {
	const mathfieldRef = useRef<typeof EditableMathField>(null!);

	return (
		<EditableMathField
			id={id}
			onChange={onChange}
			math-virtual-keyboard-policy="manual"
			smart-fence="on"
			latex={latex}
		></EditableMathField>
	);
}
