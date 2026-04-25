import { Link } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";

const features = [
  {
    title: "Log Workouts",
    description: "Track every set, rep and weight",
    icon: "🏋️",
  },
  {
    title: "Smart Analysis",
    description: "Get AI-powered recommendations",
    icon: "🧠",
  },
  {
    title: "Track Progress",
    description: "Visualize your gains over time",
    icon: "📈",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <section className="animate-fade-in space-y-5 text-center">
          <h1 className="text-5xl font-black tracking-tight text-white md:text-7xl">FitTrack Pro</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-300">
            Track your workouts. Analyze your progress. Crush your goals.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/register">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="secondary">
                Login
              </Button>
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <div className="space-y-2 text-center">
                <p className="text-3xl">{feature.icon}</p>
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </div>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
};

export default Landing;
