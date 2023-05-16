import math from 'customFunctions';
import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
	PerspectiveCamera as DefaultCamera,
	Facemesh,
} from '@react-three/drei';
import { PerspectiveCamera } from 'three';
import { Complex, complex } from 'mathjs';

export default function App() {
	const [split, setSplit] = useState(false);
	const [func, setFunc] = useState('');
	const [x, setX] = useState([-10, 10]);
	const [y, setY] = useState([-10, 10]);
	const [z, setZ] = useState([-10, 10]);
	const [step, setStep] = useState(1);
	const [points, setPoints] = useState<Complex[][]>([[]]);
	const [meshes, setMeshes] = useState<any[]>([]);

	function evaluate() {
		let xSize: number = (x[1] - x[0] + 1) / step;
		let ySize: number = (y[1] - y[0] + 1) / step;
		let tempPoints: Complex[][] = [];
		for (let j = 0; j < xSize; j++) {
			tempPoints.push([]);
			for (let k = 0; k < ySize; k++) {
				tempPoints[j].push(complex(0, 0));
			}
		}
		console.log(tempPoints);
		for (let j = 0; j < xSize; j++) {
			for (let k = 0; k < ySize; k++) {
				let scope = {
					a: j + x[0],
					b: k + y[0],
					z: complex(j + x[0], k + y[0]),
				};
				let res = math.evaluate(func, scope);
				if (typeof res == 'number') {
					tempPoints[j][k] = complex(res, 0);
				} else if (typeof res == 'object') {
					tempPoints[j][k] = res;
				}
			}
		}
		setPoints(tempPoints);
	}

	useEffect(() => {
		let tempMeshes: any[] = [];
		let newPoints = points.slice(0, -1);
		// console.log(newPoints);
		newPoints.forEach((arr, i, parent) => (newPoints[i] = arr.slice(0, -1)));
		newPoints.forEach((arr, i, parent) =>
			arr.forEach((val, j) =>
				tempMeshes.push(
					<mesh position={[i + x[0], parent[i][j].re, j + y[0]]}>
						<boxGeometry args={[0.5, 0.2, 0.5]} />
					</mesh>
				)
			)
		);
		setMeshes(tempMeshes);
		return () => {};
	}, [points]);

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
					<ambientLight intensity={0.2} />
					<pointLight intensity={0.5} position={[0, 1000, 0]} />
					<pointLight intensity={0.5} position={[0, 1000, 0]} />
					<pointLight intensity={0.5} position={[0, 1000, 0]} />
					<pointLight intensity={0.5} position={[0, 1000, 0]} />
					{/* <mesh>
						<boxGeometry args={[5, 2, 2]} />
						<meshStandardMaterial color={0x11fedd} />
					</mesh> */}
					{meshes}
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
			Math.sin(time.current / 3) * 20,
			Math.sin(time.current / 3) * 6 + 30,
			Math.cos(time.current / 3) * 20
		);
		ref.current.lookAt(0, 0, 0);
	});

	return <DefaultCamera makeDefault ref={ref} position={[0, 0, 0]} />;
}
