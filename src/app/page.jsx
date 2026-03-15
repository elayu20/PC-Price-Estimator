"use client"
import { useEffect, useState } from "react"
import PartSelect from "../../components/PartSelect";
import { saveBuild, loadBuild, clearBuild } from "../../utils/buildStorage";
import BuildControls from "../../components/BuildControls";

export default function Home() {
  const [cpu, setCpu] = useState("");
  const [gpu, setGpu] = useState("");
  const [ram, setRam] = useState("");
  const [storage, setStorage] = useState("");
  const [motherboard, setMotherboard] = useState("");
  const [psu, setPsu] = useState("");
  const [cooler, setCooler] = useState("");
  const [prices, setPrices] = useState(null);

  // Fetch prices.json
  useEffect(() => {
    // This runs once when the page first loads
    fetch("/prices.json")
      .then((res) => res.json())
      .then((data) => {
        console.log("Loaded prices:", data);
        setPrices(data);
      })
      .catch((err) => {
        console.error("Failed to load prices.json", err);
      })
  }, [])

  // Only read prices if prices are loaded
  const cpuPrice = prices && cpu ? Number(prices.cpu[cpu]) || 0 : 0;
  const gpuPrice = prices && gpu ? Number(prices.gpu[gpu]) || 0 : 0;
  const ramPrice = prices && ram ? Number(prices.ram[ram]) || 0 : 0;
  const storagePrice = prices && storage ? (prices.storage[storage]) || 0 : 0;
  const motherboardPrice = prices && motherboard ? Number(prices.motherboard[motherboard]) || 0 : 0;
  const psuPrice = prices && psu ? Number(prices.psu[psu]) || 0 : 0;
  const coolerPrice = prices && cooler ? Number(prices.cooler[cooler]) || 0 : 0;
  const total = cpuPrice + gpuPrice + ramPrice + storagePrice + motherboardPrice + psuPrice + coolerPrice; 

  const build = {
    cpu,
    gpu,
    ram,
    storage,
    motherboard,
    psu,
    cooler,
  }

  // Apply build into state (one state at a time)
  function applyBuildToState(b) {
    setCpu(b.cpu ?? "");
    setGpu(b.gpu ?? "");
    setRam(b.ram ?? "");
    setStorage(b.storage ?? "");
    setMotherboard(b.motherboard ?? "");
    setPsu(b.psu ?? "");
    setCooler(b.cooler ?? ""); 
  }

  function handleSave() {
    saveBuild(build);
  }

  function handleLoad() {
    // Load returns an object OR null
    const loaded = loadBuild();
    if (!loaded) return;

    applyBuildToState(loaded);
  }

  function handleReset() {
    // Reset UI selections
    applyBuildToState({}); // all fields become "" because of ?? ""
  }

  // If prices haven't loaded yet,t show something instead of a blank page
  if (!prices) {
    return <p>Loading prices...</p>
  }
  
  if (prices) {
    return (
      <main>
        <h1>PC Price Estimator</h1>

        <PartSelect label="CPU" value={cpu} setValue={setCpu} options={prices?.cpu}/>
        <PartSelect label="GPU" value={gpu} setValue={setGpu} options={prices?.gpu}/>
        <PartSelect label="RAM" value={ram} setValue={setRam} options={prices?.ram}/>
        <PartSelect label="Motherboard" value={motherboard} setValue={setMotherboard} options={prices?.motherboard}/>
        <PartSelect label="Storage" value={storage} setValue={setStorage} options={prices?.storage}/>
        <PartSelect label="PSU" value={psu} setValue={setPsu} options={prices?.psu}/>
        <PartSelect label="Cooler" value={cooler} setValue={setCooler} options={prices?.cooler}/>

        <div style={{ marginTop: "24px", padding: "16px", border: "1px solid #ccc" }}>
          <h3>Build Summary</h3>
          <p>CPU{cpu=="" ? "" : " " + `(${cpu})`}: ${cpuPrice.toFixed(2)}</p>
          <p>GPU{gpu=="" ? "" : " " + `(${gpu})`}: ${gpuPrice.toFixed(2)}</p>
          <p>RAM{ram=="" ? "" : " " + `(${ram})`}: ${ramPrice.toFixed(2)}</p>
          <p>Motherboard{motherboard=="" ? "" : " " + `(${motherboard})`}: ${motherboardPrice.toFixed(2)}</p>
          <p>Storage{storage=="" ? "" : " " + `(${storage})`}: ${storagePrice.toFixed(2)}</p>
          <p>PSU{psu=="" ? "" : " " + `(${psu})`}: ${psuPrice.toFixed(2)}</p>
          <p>Cooler{cooler=="" ? "" : " " + `(${cooler})`}: ${coolerPrice.toFixed(2)}</p>
  
          <h2>Total: ${total.toFixed(2)}</h2>
        </div>

      <BuildControls onSave={handleSave} onLoad={handleLoad} onReset={handleReset} />
      </main>
    );
  }
}
