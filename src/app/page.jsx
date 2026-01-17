"use client"
import { useEffect, useState } from "react"
import PartSelect from "../../components/PartSelect";

export default function Home() {
  // A unique name for what we store in the browser
  // Versioning ("v1") in case format changes later
  const STORAGE_KEY = "pcpe_build_v1";

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
  const cpuPrice = prices && cpu ? prices.cpu[cpu] : 0;
  const gpuPrice = prices && gpu ? prices.gpu[gpu] : 0;
  const ramPrice = prices && ram ? prices.ram[ram] : 0;
  const storagePrice = prices && storage ? prices.storage[storage] : 0;
  const motherboardPrice = prices && motherboard ? prices.motherboard[motherboard] : 0;
  const psuPrice = prices && psu ? prices.psu[psu] : 0;
  const coolerPrice = prices && cooler ? prices.cooler[cooler] : 0;
  const total = cpuPrice + gpuPrice + ramPrice + storagePrice + motherboardPrice + psuPrice + coolerPrice; 

  function saveBuild() {
    // Convert the build object into a string so localStorage can store it
    const buildJson = JSON.stringify(build);

    // Save it under STORAGE_KEY in the user's browser.
    localStorage.setItem(STORAGE_KEY, buildJson);

    // quick confirmation in console
    console.log("Saved build:", build);
  }

  function loadBuild() {
    // Get the saved string back out of storage
    const saved = localStorage.getItem(STORAGE_KEY);

    // If nothing was saved, do nothing
    if (!saved) {
      console.log("No saved build found.");
      return;
    }

    // Convert the JSON string back into an object
    const loadedBuild = JSON.parse(saved);

    // Now apply it back into state (one state at a time)
    setCpu(loadedBuild.cpu ?? "");
    setGpu(loadedBuild.gpu ?? "");
    setRam(loadedBuild.ram ?? "");
    setStorage(loadedBuild.storage ?? "");
    setMotherboard(loadedBuild.motherboard ?? "");
    setPsu(loadedBuild.psu ?? "");
    setCooler(loadedBuild.cooler ?? "");

    console.log("Loaded build:", loadedBuild);
  }

  // Helper for reset button
  function resetBuild() {
    setCpu("");
    setGpu("");
    setRam("");
    setStorage("");
    setMotherboard("");
    setPsu("");
    setCooler("");
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
        <p>CPU: ${cpuPrice}</p>
        <p>GPU: ${gpuPrice}</p>
        <p>RAM: ${ramPrice}</p>
        <p>Motherboard: ${motherboardPrice}</p>
        <p>Storage: ${storagePrice}</p>
        <p>PSU: ${psuPrice}</p>
        <p>Cooler: ${coolerPrice}</p>

        <button onClick={resetBuild} type="button">Clear</button>
      
        <h2>Total: ${total}</h2>

        <div style={{ display: "flex", gap: 12, marginTop: 16}}>
          <button type="button" onClick={saveBuild}>Save Build</button>
          <button type="button" onClick={loadBuild}>Load Build</button>
        </div>
      </main>
    );
  }
}
