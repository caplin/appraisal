import RadarChart from "react-svg-radar-chart";
import "react-svg-radar-chart/build/css/index.css";

export default function Chart() {
  return <RadarChart captions={captions} data={data} size={450} />;
}

const data = [
  {
    data: {
      battery: 0.7,
      design: 0.8,
      useful: 0.9,
      speed: 0.67,
      weight: 0.8,
    },
    meta: { color: "blue" },
  },
  {
    data: {
      battery: 0.6,
      design: 0.85,
      useful: 0.5,
      speed: 0.6,
      weight: 0.7,
    },
    meta: { color: "red" },
  },
];

const captions = {
  // columns
  battery: "Battery Capacity",
  design: "Design",
  useful: "Usefulness",
  speed: "Speed",
  weight: "Weight",
};
