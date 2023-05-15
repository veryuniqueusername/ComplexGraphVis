import math from 'customFunctions';
import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera as DefaultCamera } from '@react-three/drei';
import { PerspectiveCamera } from 'three';

export default function App() {
	const [split, setSplit] = useState(false);
	const [func, setFunc] = useState('');
	const [x, setX] = useState([-10, 10]);
	const [y, setY] = useState([-10, 10]);
	const [step, setStep] = useState(1);
	const [points, setPoints] = useState([[]]);

	let scope = {
		a: 3,
		b: 4,
	};

	function evaluate() {
		console.log(math.evaluate(func, scope));
	}

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
				<button onClick={() => evaluate()}>Eval</button>
			</div>
			<div id="canvas-container">
				<Canvas>
					<MyCamera />
					<ambientLight intensity={0.5} />
					<mesh>
						<boxGeometry args={[5, 2, 2]} />
						<meshStandardMaterial
							color={0x11fedd}
							opacity={0.4}
							transparent={true}
						/>
					</mesh>
					<mesh>
						<boxGeometry args={[5, 5, 1]} />
						<meshStandardMaterial
							color={0x1100dd}
							opacity={0.4}
							transparent={true}
						/>
					</mesh>
					<mesh>
						<boxGeometry args={[2, 3, 2]} />
						<meshStandardMaterial
							color={0x880000}
							opacity={0.4}
							transparent={true}
						/>
					</mesh>
				</Canvas>
			</div>
		</>
	);
}

function MyCamera() {
	const ref = useRef<PerspectiveCamera>(null!);
	const time = useRef(0);
	useFrame((state, delta) => {
		time.current += delta;
		ref.current.position.set(
			Math.sin(time.current) * 20,
			20,
			Math.cos(time.current) * 20
		);
		ref.current.lookAt(0, 0, 0);
	});

	return <DefaultCamera makeDefault ref={ref} position={[0, 0, 0]} />;
}
