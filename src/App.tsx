import { useEffect, useState } from 'react';

export default function App() {
	const [split, setSplit] = useState(false);

	return (
		<>
			<div id="functions">
				<div>
					<input id="function" placeholder="whole function" disabled={split} />
					<button id="switch" onClick={() => setSplit(!split)}>
						Switch
					</button>
				</div>
				<input id="real" placeholder="real" disabled={!split} />
				<input id="imaginary" placeholder="imaginary" disabled={!split} />
			</div>
			<div></div>
		</>
	);
}
