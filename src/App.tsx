import math from 'customFunctions';
import { useEffect, useState } from 'react';

export default function App() {
	const [split, setSplit] = useState(false);
	const [func, setFunc] = useState('');

	let scope = {
		a: 3,
		b: 4,
	};

	return (
		<>
			<div id="functions">
				<span>
					<i>f</i>(z) =
				</span>
				<input
					id="function"
					placeholder="Function (z = a + bi)"
					disabled={split}
					onChange={(e) => setFunc(e.target.value)}
					value={func}
				/>
				<button onClick={() => console.log(math.evaluate(func, scope))}>
					Eval
				</button>
			</div>
			<div></div>
		</>
	);
}
