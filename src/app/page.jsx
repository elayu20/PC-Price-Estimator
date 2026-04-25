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
  const [liveEbayTotal, setLiveEbayTotal] = useState(null);
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [individualLivePrices, setIndividualLivePrices] = useState({
    cpu: null,
    gpu: null,
    ram: null,
    motherboard: null,
    storage: null,
    psu: null,
    cooler: null,
  });

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
  const cpuPrice = individualLivePrices.cpu || 0;
  const gpuPrice = individualLivePrices.gpu || 0;
  const ramPrice = individualLivePrices.ram || 0;
  const storagePrice = individualLivePrices.storage || 0;
  const motherboardPrice = individualLivePrices.motherboard || 0;
  const psuPrice = individualLivePrices.psu || 0;
  const coolerPrice = individualLivePrices.cooler || 0;
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
    // Set the names
    setCpu(b.cpu ?? "");
    setGpu(b.gpu ?? "");
    setRam(b.ram ?? "");
    setStorage(b.storage ?? "");
    setMotherboard(b.motherboard ?? "");
    setPsu(b.psu ?? "");
    setCooler(b.cooler ?? ""); 

    // Immediately fetch live prices for the loaded parts
    if (b.cpu) fetchIndividualPrice("cpu", b.cpu);
    if (b.gpu) fetchIndividualPrice("gpu", b.gpu);
    if (b.ram) fetchIndividualPrice("ram", b.ram);
    if (b.storage) fetchIndividualPrice("storage", b.storage);
    if (b.motherboard) fetchIndividualPrice("motherboard", b.motherboard);
    if (b.psu) fetchIndividualPrice("psu", b.psu);
    if (b.cooler) fetchIndividualPrice("cooler", b.cooler);
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

  // Fetches the live price for an array of parts one by one
  async function handleGetLiveTotal() {
    setIsFetchingLive(true);
    setLiveEbayTotal(null); // clear the old total

    // Make a list of whatever parts are currently selected
    const selectedParts = [cpu, gpu, ram, storage, motherboard, psu, cooler].filter(part => part !== "");

    let newLiveTotal = 0;

    // Loop through each selected part and ask backend for the eBay price
    for (const part of selectedParts) {
      try {
        console.log(`Asking API for: ${part}`); // DIAGNOSTIC LOG

        // Use encodeURIComponent so spaces become %20 (URL safe)
        const response = await fetch(`api/test?part=${encodeURIComponent(part)}`);
        if (!response.ok) {
          console.error(`Backend API failed for ${part} with status ${response.status}`);
          continue;
        }
        const data = await response.json();

        // Add the live pricing to running total
        if (data.price_cad) {
          newLiveTotal += data.price_cad;
        }
      } catch (error) {
        console.error(`Failed to fetch live price for ${part}`, error);
      }
    }

    setLiveEbayTotal(newLiveTotal);
    setIsFetchingLive(false);
  }

  // Fetches the price for one specific part and saves it to state
  async function fetchIndividualPrice(partType, partName) {
    // If the user selected "Choose a CPU..." (empty string), reset the price to null
    if (!partName) {
      setIndividualLivePrices(prev => ({ ...prev, [partType]: null}));
      return;
    }

    try {
      console.log(`Fetching individual price for ${partName}...`);
      const response = await fetch(`/api/test?part=${encodeURIComponent(partName)}`);

      if (!response.ok) throw new Error("API failed");

      const data = await response.json();

      // Update the specific part's price in memory bank
      if (data.price_cad) {
        setIndividualLivePrices(prev => ({ ...prev, [partType]: data.price_cad }));
      }     
    } catch (error) {
        console.error(`Failed to fetch individual price for ${partName}`, error);
    }
  }

  // If prices haven't loaded yet,t show something instead of a blank page
  if (!prices) {
    return <p>Loading prices...</p>
  }
  
  if (prices) {
    return (
      <main>
        <h1>PC Price Estimator</h1>

        {/* --- CPU --- */}
        <div style={{ marginBottom: "12px" }}>
          <PartSelect 
            label="CPU" 
            value={cpu} 
            setValue={(val) => { setCpu(val); fetchIndividualPrice("cpu", val); }} 
            options={prices?.cpu}
          />
          {individualLivePrices.cpu !== null && (
            <div style={{ color: "#00a82d", fontWeight: "bold", marginTop: "-12px", marginLeft: "8px" }}>
              ↳ ${individualLivePrices.cpu.toFixed(2)} CAD (Live eBay)
            </div>
          )}
        </div>

        {/* --- GPU --- */}
        <div style={{ marginBottom: "12px" }}>
          <PartSelect 
            label="GPU" 
            value={gpu} 
            setValue={(val) => { setGpu(val); fetchIndividualPrice("gpu", val); }} 
            options={prices?.gpu}
          />
          {individualLivePrices.gpu !== null && (
            <div style={{ color: "#00a82d", fontWeight: "bold", marginTop: "-12px", marginLeft: "8px" }}>
              ↳ ${individualLivePrices.gpu.toFixed(2)} CAD (Live eBay)
            </div>
          )}
        </div>

        {/* --- RAM --- */}
        <div style={{ marginBottom: "12px" }}>
          <PartSelect 
            label="RAM" 
            value={ram} 
            setValue={(val) => { setRam(val); fetchIndividualPrice("ram", val); }} 
            options={prices?.ram}
          />
          {individualLivePrices.ram !== null && (
            <div style={{ color: "#00a82d", fontWeight: "bold", marginTop: "-12px", marginLeft: "8px" }}>
              ↳ ${individualLivePrices.ram.toFixed(2)} CAD (Live eBay)
            </div>
          )}
        </div>

        {/* --- MOTHERBOARD --- */}
        <div style={{ marginBottom: "12px" }}>
          <PartSelect 
            label="Motherboard" 
            value={motherboard} 
            setValue={(val) => { setMotherboard(val); fetchIndividualPrice("motherboard", val); }} 
            options={prices?.motherboard}
          />
          {individualLivePrices.motherboard !== null && (
            <div style={{ color: "#00a82d", fontWeight: "bold", marginTop: "-12px", marginLeft: "8px" }}>
              ↳ ${individualLivePrices.motherboard.toFixed(2)} CAD (Live eBay)
            </div>
          )}
        </div>

        {/* --- STORAGE --- */}
        <div style={{ marginBottom: "12px" }}>
          <PartSelect 
            label="Storage" 
            value={storage} 
            setValue={(val) => { setStorage(val); fetchIndividualPrice("storage", val); }} 
            options={prices?.storage}
          />
          {individualLivePrices.storage !== null && (
            <div style={{ color: "#00a82d", fontWeight: "bold", marginTop: "-12px", marginLeft: "8px" }}>
              ↳ ${individualLivePrices.storage.toFixed(2)} CAD (Live eBay)
            </div>
          )}
        </div>

        {/* --- PSU --- */}
        <div style={{ marginBottom: "12px" }}>
          <PartSelect 
            label="PSU" 
            value={psu} 
            setValue={(val) => { setPsu(val); fetchIndividualPrice("psu", val); }} 
            options={prices?.psu}
          />
          {individualLivePrices.psu !== null && (
            <div style={{ color: "#00a82d", fontWeight: "bold", marginTop: "-12px", marginLeft: "8px" }}>
              ↳ ${individualLivePrices.psu.toFixed(2)} CAD (Live eBay)
            </div>
          )}
        </div>

        {/* --- COOLER --- */}
        <div style={{ marginBottom: "12px" }}>
          <PartSelect 
            label="Cooler" 
            value={cooler} 
            setValue={(val) => { setCooler(val); fetchIndividualPrice("cooler", val); }} 
            options={prices?.cooler}
          />
          {individualLivePrices.cooler !== null && (
            <div style={{ color: "#00a82d", fontWeight: "bold", marginTop: "-12px", marginLeft: "8px" }}>
              ↳ ${individualLivePrices.cooler.toFixed(2)} CAD (Live eBay)
            </div>
          )}
        </div>

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

          {/* LIVEEBAY PRICING SECTION */}
          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "2px dashed #ccc" }}>
            <button
              onClick={handleGetLiveTotal}
              disabled={isFetchingLive}
              style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer", backgroundColor: "#0053A0", color: "white", border: "none", borderRadius: "4px" }}
            >
              {isFetchingLive ? "Searching ebay..." : "Get Live eBay Total"}
            </button>

            {/* Only show the live total if we have successfuly fetched it */}
            {liveEbayTotal !== null && (
              <h2 style={{ color: "#0053A0" }}>
                Live Market Total (CAD): ${liveEbayTotal.toFixed(2)}
              </h2>
            )}
          </div>
        </div>

      <BuildControls onSave={handleSave} onLoad={handleLoad} onReset={handleReset} />
      </main>
    );
  }
}
