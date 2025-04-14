import { FC, useEffect, useRef } from "react";

const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    const [dx, dy] = [x1 - x2, y1 - y2];
    const norm = Math.sqrt(dx * dx + dy * dy);
    const [udx, udy] = [dx / norm, dy / norm];
    const size = norm / 7;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 + udx * size - udy * size, y2 + udx * size + udy * size);
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 + udx * size + udy * size, y2 - udx * size + udy * size);
    ctx.stroke();
};

export interface ICurveProps {
    ethReserve: number;
    tokenReserve: number;
    addingEth: number;
    addingToken: number;
    width: number;
    height: number;
    xAxisLabel?: string;
    yAxisLabel?: string;
}

export const Curve: FC<ICurveProps> = (props: ICurveProps) => {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) {
            return;
        }

        const textSize = 12;
        const width = canvas.width;
        const height = canvas.height;

        if (props.ethReserve && props.tokenReserve) {
            const k = props.ethReserve * props.tokenReserve;

            const ctx = canvas.getContext("2d");
            if (ctx == null) {
                return;
            }
            ctx.clearRect(0, 0, width, height);

            // Increased range for better visualization
            let maxX = k / (props.ethReserve / 8); // Changed from 4 to 8 for wider range
            let minX = 0;

            if (props.addingEth || props.addingToken) {
                maxX = k / (props.ethReserve * 0.2); // Changed from 0.4 to 0.2 for wider range
                minX = k / Math.max(0, 1000 - props.ethReserve); // Changed from 500 to 1000
            }

            const maxY = (maxX * height) / width;
            const minY = (minX * height) / width;

            const plotX = (x: number) => {
                return ((x - minX) / (maxX - minX)) * width;
            };

            const plotY = (y: number) => {
                return height - ((y - minY) / (maxY - minY)) * height;
            };

            // Draw axes
            ctx.strokeStyle = "#000000";
            ctx.fillStyle = "#000000";
            ctx.font = textSize + "px Arial";
            
            // Y axis
            ctx.beginPath();
            ctx.moveTo(plotX(minX), plotY(0));
            ctx.lineTo(plotX(minX), plotY(maxY));
            ctx.stroke();
            
            // X axis
            ctx.beginPath();
            ctx.moveTo(plotX(0), plotY(minY));
            ctx.lineTo(plotX(maxX), plotY(minY));
            ctx.stroke();

            // Draw curve
            ctx.lineWidth = 2;
            ctx.beginPath();
            let first = true;
            for (let x = minX; x <= maxX; x += maxX / width) {
                const y = k / x;
                if (first) {
                    ctx.moveTo(plotX(x), plotY(y));
                    first = false;
                } else {
                    ctx.lineTo(plotX(x), plotY(y));
                }
            }
            ctx.stroke();

            ctx.lineWidth = 1;

            // Handle token swaps
            if (props.addingEth) {
                const newEthReserve = props.ethReserve + parseFloat(props.addingEth.toString());

                ctx.fillStyle = "#bbbbbb";
                ctx.beginPath();
                ctx.arc(plotX(newEthReserve), plotY(k / newEthReserve), 5, 0, 2 * Math.PI);
                ctx.fill();

                ctx.strokeStyle = "#009900";
                drawArrow(
                    ctx,
                    plotX(props.ethReserve),
                    plotY(props.tokenReserve),
                    plotX(newEthReserve),
                    plotY(props.tokenReserve),
                );

                ctx.fillStyle = "#000000";
                ctx.fillText(
                    `${props.addingEth} ${props.xAxisLabel || 'ETH'} input`,
                    plotX(props.ethReserve) + textSize,
                    plotY(props.tokenReserve) - textSize,
                );

                ctx.strokeStyle = "#990000";
                drawArrow(
                    ctx,
                    plotX(newEthReserve),
                    plotY(props.tokenReserve),
                    plotX(newEthReserve),
                    plotY(k / newEthReserve),
                );

                const amountGained = Math.round((10000 * (props.addingEth * props.tokenReserve)) / newEthReserve) / 10000;
                ctx.fillStyle = "#000000";
                ctx.fillText(
                    `${amountGained} ${props.yAxisLabel || '🎈'} output (-0.3% fee)`,
                    plotX(newEthReserve) + textSize,
                    plotY(k / newEthReserve),
                );
            } else if (props.addingToken) {
                const newTokenReserve = props.tokenReserve + parseFloat(props.addingToken.toString());

                ctx.fillStyle = "#bbbbbb";
                ctx.beginPath();
                ctx.arc(plotX(k / newTokenReserve), plotY(newTokenReserve), 5, 0, 2 * Math.PI);
                ctx.fill();

                ctx.strokeStyle = "#990000";
                drawArrow(
                    ctx,
                    plotX(props.ethReserve),
                    plotY(props.tokenReserve),
                    plotX(props.ethReserve),
                    plotY(newTokenReserve),
                );

                ctx.fillStyle = "#000000";
                ctx.fillText(
                    `${props.addingToken} ${props.yAxisLabel || '🎈'} input`,
                    plotX(props.ethReserve) + textSize,
                    plotY(props.tokenReserve),
                );

                ctx.strokeStyle = "#009900";
                drawArrow(
                    ctx,
                    plotX(props.ethReserve),
                    plotY(newTokenReserve),
                    plotX(k / newTokenReserve),
                    plotY(newTokenReserve),
                );

                const amountGained = Math.round((10000 * (props.addingToken * props.ethReserve)) / newTokenReserve) / 10000;
                ctx.fillStyle = "#000000";
                ctx.fillText(
                    `${amountGained} ${props.xAxisLabel || 'ETH'} output (-0.3% fee)`,
                    plotX(k / newTokenReserve) + textSize,
                    plotY(newTokenReserve) - textSize,
                );
            }

            // Current point
            ctx.fillStyle = "#0000FF";
            ctx.beginPath();
            ctx.arc(plotX(props.ethReserve), plotY(props.tokenReserve), 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    }, [props]);

    return (
        <div style={{ position: "relative", width: props.width, height: props.height }}>
            <canvas style={{ position: "absolute", left: 0, top: 0 }} ref={ref} width={props.width} height={props.height} />
            <div style={{ position: "absolute", left: "20%", bottom: -20 }}>
                -- {props.xAxisLabel || 'ETH'} Reserve --{">"}
            </div>
            <div style={{ 
                position: "absolute", 
                left: -20, 
                bottom: "20%", 
                transform: "rotate(-90deg)", 
                transformOrigin: "0 0" 
            }}>
                -- {props.yAxisLabel || 'Token'} Reserve --{">"}
            </div>
        </div>
    );
};