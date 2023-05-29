import math from 'customFunctions';
import { Ref, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
	PerspectiveCamera as DefaultCamera,
	Line,
	OrbitControls,
	Text,
} from '@react-three/drei';
import { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { BufferAttribute, BufferGeometry, DoubleSide } from 'three';
import { Complex, complex, pi } from 'mathjs';
import { lerp } from 'three/src/math/MathUtils';
import Mathfield from 'Mathfield';
import { EditableMathField, StaticMathField, addStyles } from 'react-mathquill';
import evaluatex from 'evaluatex';
import { ComputeEngine } from '@cortex-js/compute-engine';

// TODO: IF NUMBER IS UNDEFINED, DON'T DRAW TRIGS

addStyles();

const ce = new ComputeEngine({ numericMode: 'complex' });

export default function App() {
	const [degMode, setDegMode] = useState(
		localStorage.getItem('graphSettings') !== null
			? JSON.parse(localStorage.getItem('graphSettings')!).colorMode
			: true
	);
	const [func, setFunc] = useState<string>(
		localStorage.getItem('graphSettings') !== null
			? JSON.parse(localStorage.getItem('graphSettings')!).func
			: ''
	);
	const [swap, setSwap] = useState(
		localStorage.getItem('graphSettings') !== null
			? JSON.parse(localStorage.getItem('graphSettings')!).complexMode
			: false
	);
	const [wireframe, setWireframe] = useState(false);
	const [x, setX] = useState(
		localStorage.getItem('graphSettings') !== null
			? JSON.parse(localStorage.getItem('graphSettings')!).x
			: [-20, 20]
	);
	const [y, setY] = useState(
		localStorage.getItem('graphSettings') !== null
			? JSON.parse(localStorage.getItem('graphSettings')!).y
			: [-20, 20]
	);
	const [z, setZ] = useState(
		localStorage.getItem('graphSettings') !== null
			? JSON.parse(localStorage.getItem('graphSettings')!).z
			: [-20, 20]
	);
	const [step, setStep] = useState(
		localStorage.getItem('graphSettings') !== null
			? JSON.parse(localStorage.getItem('graphSettings')!).step
			: 1
	);
	const [scale, setScale] = useState(
		localStorage.getItem('graphSettings') !== null
			? JSON.parse(localStorage.getItem('graphSettings')!).scale
			: 1
	);

	const maxZ = useRef(0);
	const minZ = useRef(0);
	const [points, setPoints] = useState<Complex[][]>([[]]);
	const [meshes, setMeshes] = useState<any>([]);
	const [cameraX, setCameraX] = useState(50);
	const [cameraY, setCameraY] = useState(20);
	const [cameraZ, setCameraZ] = useState(50);

	const bufferGeo = useRef<BufferGeometry>(null!);
	const posRef = useRef<BufferAttribute>(null!);
	const normalRef = useRef<BufferAttribute>(null!);
	const colorRef = useRef<BufferAttribute>(null!);
	const indexRef = useRef<BufferAttribute>(null!);
	const cameraRef = useRef<OrbitControlsType>(null!);

	const xFaceCount = (x[1] - x[0]) / step;
	const yFaceCount = (y[1] - y[0]) / step;

	function evaluate() {
		maxZ.current = 0;
		minZ.current = 0;
		let xVertCount: number = xFaceCount + 1;
		let yVertCount: number = yFaceCount + 1;
		let newPoints: Complex[][] = [];
		for (let j = 0; j < xVertCount; j++) {
			newPoints.push([]);
			for (let k = 0; k < yVertCount; k++) {
				newPoints[j].push(complex(0, 0));
			}
		}
		let fn = ce.parse(func);
		for (let j = 0; j < xVertCount; j++) {
			for (let k = 0; k < yVertCount; k++) {
				let scope = {
					a: j * step + x[0],
					b: k * step + y[0],
				};
				ce.set(scope);
				let res = fn.N().simplify().N().numericValue;
				if (res === null) {
					console.log('null @ ' + j + ' ' + k);
					newPoints[j][k] = complex(0, 0);
				} else if (typeof res === 'number') {
					if (res === Infinity || res === -Infinity) {
						console.log('infinity');
					}
					newPoints[j][k] = swap ? complex(0, res) : complex(res, 0);
				} else if (isComplex(res)) {
					newPoints[j][k] = swap
						? complex(res.im, res.re)
						: complex(res.re, res.im);
					maxZ.current = Math.max(maxZ.current, newPoints[j][k].im);
					minZ.current = Math.min(minZ.current, newPoints[j][k].im);
				} else {
					console.log('wrong type, not complex');
					console.log(res);
					newPoints[j][k] = complex(0, 0);
				}
			}
		}
		setPoints(newPoints);
	}

	useLayoutEffect(() => {
		if (posRef.current === null) return;

		let newPoints = points.slice(0, -1);
		newPoints.forEach((arr, i, parent) => (newPoints[i] = arr.slice(0, -1)));

		const offsetX = x[0];
		const offsetY = y[0];

		const vertices: number[] = [];
		const normals: number[] = [];
		const colors: number[] = [];
		const indices: number[] = [];

		points.forEach((arr, i, parent) =>
			arr.forEach((val, j) => {
				vertices.push(
					i * step + offsetX,
					points[i][j].re * scale,
					j * step + offsetY
				);
				normals.push(...[0, 1, 0]);
				if (degMode) {
					let deg = math.arg(points[i][j]) / (2 * pi);
					if (deg < 0) deg += 1;
					colors.push(...HSVtoRGB(deg, 1, 1));
				} else {
					colors.push(
						...HSVtoRGB(
							0,
							0,
							(points[i][j].im + maxZ.current) / (maxZ.current - minZ.current)
						)
					);
				}
			})
		);

		newPoints.forEach((arr, i, parent) =>
			arr.forEach((val, j) => {
				indices.push(
					...[
						i * (arr.length + 1) + j,
						i * (arr.length + 1) + j + 1,
						(i + 1) * (arr.length + 1) + j,
						i * (arr.length + 1) + j + 1,
						(i + 1) * (arr.length + 1) + j,
						(i + 1) * (arr.length + 1) + j + 1,
					]
				);
			})
		);

		posRef.current.array = new Float32Array(vertices);
		posRef.current.count = vertices.length / 3;
		normalRef.current.array = new Float32Array(normals);
		normalRef.current.count = normals.length / 3;
		colorRef.current.array = new Float32Array(colors);
		colorRef.current.count = colors.length / 3;
		indexRef.current.array = new Uint16Array(indices);
		indexRef.current.count = indices.length;
		posRef.current.needsUpdate = true;
		normalRef.current.needsUpdate = true;
		colorRef.current.needsUpdate = true;
		indexRef.current.needsUpdate = true;

		bufferGeo.current.computeBoundingBox();
		bufferGeo.current.computeBoundingSphere();
		// bufferGeo.current.computeVertexNormals();

		return () => {};
	}, [points]);

	return (
		<>
			<div id="functions">
				<StaticMathField>{'f\\left(z\\right)='}</StaticMathField>
				<EditableMathField
					latex={func}
					onChange={(field) => {
						setFunc(field.latex());
						save();
					}}
				/>
				<button className="button" onClick={() => evaluate()}>
					Eval
				</button>
				<button className="button" onClick={() => setDegMode(!degMode)}>
					Color Mode
				</button>
				<button className="button" onClick={() => setSwap(!swap)}>
					Swap Complex
				</button>
				<button className="button" onClick={() => setWireframe(!wireframe)}>
					Wireframe
				</button>
			</div>
			<div id="container">
				<div id="settings">
					<label htmlFor="minA">Min A</label>
					<input
						type="number"
						value={x[0]}
						className="numberInput"
						name="minA"
						onInput={(e) =>
							setX([Math.min(x[1], parseInt(e.currentTarget.value)), x[1]])
						}
					/>
					<label htmlFor="maxA">Max A</label>
					<input
						type="number"
						value={x[1]}
						className="numberInput"
						name="maxA"
						onInput={(e) =>
							setX([x[0], Math.max(x[0], parseInt(e.currentTarget.value))])
						}
					/>
					<label htmlFor="minB">Min B</label>
					<input
						type="number"
						value={y[0]}
						className="numberInput"
						name="minB"
						onInput={(e) =>
							setY([Math.min(y[1], parseInt(e.currentTarget.value)), y[1]])
						}
					/>
					<label htmlFor="maxB">Max B</label>
					<input
						type="number"
						value={y[1]}
						className="numberInput"
						name="maxB"
						onInput={(e) =>
							setY([y[0], Math.max(y[0], parseInt(e.currentTarget.value))])
						}
					/>
					<label htmlFor="minZ">Min Z</label>
					<input
						type="number"
						value={z[0]}
						className="numberInput"
						name="minZ"
						onInput={(e) =>
							setZ([Math.min(z[1], parseInt(e.currentTarget.value)), z[1]])
						}
					/>
					<label htmlFor="maxZ">Max Z</label>
					<input
						type="number"
						value={z[1]}
						className="numberInput"
						name="maxZ"
						onInput={(e) =>
							setZ([z[0], Math.max(z[0], parseInt(e.currentTarget.value))])
						}
					/>
					<label htmlFor="step">Step</label>
					<input
						type="number"
						value={step}
						className="numberInput"
						name="step"
						min={0.1}
						step={0.1}
						onInput={(e) =>
							setStep(Math.max(0.1, parseFloat(e.currentTarget.value)))
						}
					/>
					<label htmlFor="scale">Scale</label>
					<input
						type="number"
						value={scale}
						className="numberInput"
						name="scale"
						step={0.05}
						onInput={(e) => {
							setScale(parseFloat(e.currentTarget.value));
							save();
						}}
					/>
					<button className="button" onClick={() => reload()}>
						Reload
					</button>
					<button className="button" onClick={() => reset()}>
						Reset
					</button>
				</div>
				<div id="canvas-container">
					<Canvas camera={{ far: 100000 }}>
						<OrbitControls ref={cameraRef} />
						<ambientLight intensity={0.5} />
						{/* <directionalLight intensity={1} /> */}
						<mesh>
							<sphereGeometry args={[0.5, 10, 10]} />
							<meshBasicMaterial
								color={[0, 0, 0]}
								opacity={0.1}
								transparent={true}
							/>
						</mesh>
						<mesh>
							<meshBasicMaterial color={[0, 0, 0]} />
							<Line
								points={[
									[x[0], 0, 0],
									[x[1], 0, 0],
								]}
								dashed={true}
								dashSize={1}
								dashScale={5}
								lineWidth={2}
							/>
							<DynamicText position={[x[0], 0, 0]} cameraRef={cameraRef}>
								-a
							</DynamicText>
							<DynamicText position={[x[1], 0, 0]} cameraRef={cameraRef}>
								+a
							</DynamicText>
							<Line
								points={[
									[0, 0, y[0]],
									[0, 0, y[1]],
								]}
								dashed={true}
								dashSize={1}
								dashScale={5}
								lineWidth={2}
							/>
							<DynamicText position={[0, 0, y[0]]} cameraRef={cameraRef}>
								-b
							</DynamicText>
							<DynamicText position={[0, 0, y[1]]} cameraRef={cameraRef}>
								+b
							</DynamicText>
							<Line
								points={[
									[0, z[0], 0],
									[0, z[1], 0],
								]}
								dashed={true}
								dashSize={1}
								dashScale={5}
								lineWidth={2}
							/>
							<DynamicText position={[0, z[0], 0]} cameraRef={cameraRef}>
								-f(z)
							</DynamicText>
							<DynamicText position={[0, z[1], 0]} cameraRef={cameraRef}>
								+f(z)
							</DynamicText>
						</mesh>
						<mesh>
							<meshStandardMaterial
								vertexColors
								side={DoubleSide}
								wireframe={wireframe}
							/>
							<bufferGeometry ref={bufferGeo}>
								<bufferAttribute
									ref={posRef}
									attach={'attributes-position'}
									array={
										new Float32Array((xFaceCount + 1) * (yFaceCount + 1) * 3)
									}
									count={4}
									itemSize={3}
								/>
								<bufferAttribute
									ref={normalRef}
									attach="attributes-normal"
									array={
										new Float32Array((xFaceCount + 1) * (yFaceCount + 1) * 3)
									}
									count={4}
									itemSize={3}
								/>
								<bufferAttribute
									ref={colorRef}
									attach="attributes-color"
									array={
										new Float32Array((xFaceCount + 1) * (yFaceCount + 1) * 3)
									}
									count={4}
									itemSize={3}
								/>
								<bufferAttribute
									ref={indexRef}
									attach={'index'}
									array={new Uint16Array(xFaceCount * yFaceCount * 6)}
									count={6}
									itemSize={1}
								/>
							</bufferGeometry>
						</mesh>
					</Canvas>
				</div>
			</div>
		</>
	);

	function save() {
		localStorage.setItem(
			'graphSettings',
			JSON.stringify({
				x: x,
				y: y,
				z: z,
				func: func,
				colorMode: degMode,
				complexMode: swap,
				step: step,
				scale: scale,
			})
		);
	}

	function reload() {
		save();
		window.location.reload();
	}
	function reset() {
		localStorage.removeItem('graphSettings');
		window.location.reload();
	}
}

function DynamicText({
	position,
	children,
	cameraRef,
}: {
	position: any;
	children: any;
	cameraRef: React.MutableRefObject<OrbitControlsType>;
}) {
	const ref = useRef<any>(null!);

	useFrame((state, delta) => {
		if (cameraRef.current === null) return;
		// console.log(cameraRef.current.position0);
		ref.current.rotation;
	});

	return (
		<Text
			ref={ref}
			color="black"
			anchorX="center"
			anchorY="middle"
			position={position}
		>
			{children}
		</Text>
	);
}

function HSVtoRGB(h: number, s: number, v: number) {
	var r: number,
		g: number,
		b: number,
		i: number,
		f: number,
		p: number,
		q: number,
		t: number;
	i = Math.floor(h * 6);
	f = h * 6 - i;
	p = v * (1 - s);
	q = v * (1 - f * s);
	t = v * (1 - (1 - f) * s);
	switch (i % 6) {
		case -1:
		case 0:
			(r = v), (g = t), (b = p);
			break;
		case 1:
			(r = q), (g = v), (b = p);
			break;
		case 2:
			(r = p), (g = v), (b = t);
			break;
		case 3:
			(r = p), (g = q), (b = v);
			break;
		case 4:
			(r = t), (g = p), (b = v);
			break;
		case 5:
		case 6:
			(r = v), (g = p), (b = q);
			break;
		default:
			console.log('default HSVtoRGB');
			(r = 1), (b = 0), (g = 0);
			break;
	}
	return [r, g, b];
}

function isComplex(num: any): num is Complex {
	return (num as Complex).re !== undefined;
}
