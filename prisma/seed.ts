// IMPORTS
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// INITIALIZATION
const prisma = new PrismaClient(); // turns engine on

// INTERFACES

// Define what a CPU object looks like in JSON data
interface CpuJson {
    name: string;
    price: number;
    microarchitecture: string;
    core_count: number;
    tdp: number;
}

// Define Motherboard in JSON data
interface MotherboardJson {
    name: string;
    price: number;
    socket: string;
    form_factor: string;
    memory_slots: number;
}

interface GpuJson {
    name: string;
    price: number;
    chipset: string;
    memory: number;
}

interface PsuJson {
    name: string;
    price: number;
    type: string;
    efficiency: string;
    modular: string;
    wattage: number;
}

interface RamJson {
    name: string;
    price: number;
    speed: number | number[];
    modules: [number, number];
}

interface StorageJson {
    name: string;
    price: number;
    type: string | number;
    capacity: number;
    interface: string;
}

interface CoolerJson {
    name: string;
    price: number;
    rpm: number | number[];
    noise_level: number | number[];
}

// Maps microarchitecture for desktop cpus into common sockets (covers 99% of standard PC parts)
const socketMap: Record<string, string> = {
    // ==========================================
    // AMD ARCHITECTURES
    // ==========================================
  
    // Modern Mainstream (Ryzen)
    "Zen 5": "AM5",
    "Zen 4": "AM5",
    "Zen 3": "AM4",
    "Zen 2": "AM4",
    "Zen+": "AM4",
    "Zen": "AM4",

    // Modern HEDT (Threadripper)
    "Zen 4 Threadripper": "sTR5",
    "Zen 3 Threadripper": "sWRX8", 
    "Zen 2 Threadripper": "sTRX4",
    "Zen+ Threadripper": "TR4",
    "Zen Threadripper": "TR4",

    // Legacy AMD (FX, Athlon, Phenom)
    "Excavator": "AM4",      // Late APUs
    "Steamroller": "FM2+",   // Older APUs
    "Piledriver": "AM3+",    // FX-8350 era
    "Bulldozer": "AM3+",     // FX-8150 era
    "K10": "AM3",            // Phenom II era
    "K8": "AM2",             // Athlon 64 era

    // ==========================================
    // INTEL ARCHITECTURES
    // ==========================================

    // Modern Mainstream (Core)
    "Arrow Lake": "LGA1851",          // Core Ultra 200 Series
    "Raptor Lake Refresh": "LGA1700", // 14th Gen
    "Raptor Lake": "LGA1700",         // 13th Gen
    "Alder Lake": "LGA1700",          // 12th Gen
    "Rocket Lake": "LGA1200",         // 11th Gen
    "Comet Lake": "LGA1200",          // 10th Gen
    "Coffee Lake Refresh": "LGA1151-v2", // 9th Gen
    "Coffee Lake": "LGA1151-v2",         // 8th Gen
    "Kaby Lake": "LGA1151-v1",           // 7th Gen
    "Skylake": "LGA1151-v1",             // 6th Gen

    // Older Mainstream (Core i-Series)
    "Broadwell": "LGA1150",           // 5th Gen
    "Haswell": "LGA1150",             // 4th Gen
    "Ivy Bridge": "LGA1155",          // 3rd Gen
    "Sandy Bridge": "LGA1155",        // 2nd Gen
    "Westmere": "LGA1156",            // 1st Gen (Late)
    "Nehalem": "LGA1156",             // 1st Gen (Early)

    // Legacy Intel (Core 2 Duo/Quad)
    "Penryn": "LGA775",
    "Wolfdale": "LGA775",
    "Conroe": "LGA775",
    "Prescott": "LGA775",

    // Modern / Legacy HEDT (Core X / Extreme Edition)
    "Cascade Lake-X": "LGA2066",      // 10th Gen X
    "Skylake-X": "LGA2066",           // 7th/9th Gen X
    "Broadwell-E": "LGA2011-v3",      // 6th Gen Extreme
    "Haswell-E": "LGA2011-v3",        // 5th Gen Extreme
    "Ivy Bridge-E": "LGA2011",        // 4th Gen Extreme
    "Sandy Bridge-E": "LGA2011",      // 3rd Gen Extreme
};

// Batch helper function
async function seedInBatches<T>(dataArray: T[], batchSize: number, createFunction: (item: T) => Promise<any>) {
    for (let i = 0; i < dataArray.length; i+= batchSize) {
        const batch = dataArray.slice(i, i + batchSize);
        await Promise.all(batch.map(item => createFunction(item)));
        console.log(`...seeded ${Math.min(i + batchSize, dataArray.length)} of ${dataArray.length}`)
    }
}

// MAIN FUNC
async function main() {
    console.log("Starting the database seeding process...");
    const BATCH_SIZE = 200;

    // --- CPUS ---
    
    console.log("Processing CPUs...");
    const cpuData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/cpus.json'), 'utf8')) as CpuJson[];

    await seedInBatches(cpuData, BATCH_SIZE, (item) => {
        // Look up the architecture in dictionary
        // If it's not found, default to "Unknown"
        const detectedSocket = socketMap[item.microarchitecture] || "Unknown";

        return prisma.part.create({
            data: {
                name: item.name,
                brand: item.name.split(" ")[0] || "Unknown", // Grabs AMD or Intel from the start of the name
                category: "CPU",
                basePrice: item.price,
                cpuDetails: {
                    create: {
                        socket: detectedSocket,
                        cores: item.core_count,
                        threads: item.core_count * 2,
                        wattage: item.tdp,
                    }
                }
            }
        });
    }) 

    // --- MOTHERBOARDS ---
    
    console.log("Processing Motherboards...");
    const moboData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/motherboard.json'), 'utf8')) as MotherboardJson[];

    await seedInBatches(moboData, BATCH_SIZE, (item) => {

        return prisma.part.create({
            data: {
                name: item.name,
                brand: item.name.split(" ")[0] || "Unknown",
                category: "Motherboard",
                basePrice: item.price,
                motherboardDetails: {
                    create: {
                        socket: item.socket,
                        formFactor: item.form_factor,
                        ramSlots: item.memory_slots,
                        hasWifi: item.name.includes("WIFI")
                    }
                }
            }
        })
    })


    // -- GPUS --
    console.log("Processing GPUs...");
    const gpuData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/gpus.json'), 'utf8')) as GpuJson[];
    
    await seedInBatches(gpuData, BATCH_SIZE, (item) => {
        return prisma.part.create({
            data: {
                name: item.name + " " + item.chipset,
                brand: item.name.split(" ")[0] || "Unknown",
                category: "GPU",
                basePrice: item.price,
                gpuDetails: {
                    create: {
                        chipset: item.chipset,
                        vramGb: item.memory
                    }
                }
            }
        })
    })

    // --- PSUS ---
    
    console.log("Processing PSUs...");
    const psuData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/psu.json'), 'utf8')) as PsuJson[];

    await seedInBatches(psuData, BATCH_SIZE, (item) => {
        return prisma.part.create({
            data: {
                name: item.name,
                brand: item.name.split(" ")[0] || "Unknown",
                category: "PSU",
                basePrice: item.price,
                psuDetails: {
                    create: {
                        wattage: item.wattage,
                        efficiency: item.efficiency || "None",
                        modularity: item.modular || "None",
                        size: item.type
                    }
                }
            }
        });
    })

    
    // --- RAM ---
    console.log("Processing RAM...");
    const ramData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/ram.json'), 'utf8')) as RamJson[] ;

    await seedInBatches(ramData, BATCH_SIZE, (item) => {
        // Fallback variables
        let parsedSpeedMhz = 0;
        let parsedGeneration = "Unknown";

        // Type Check Logic
        if (Array.isArray(item.speed) && item.speed.length >= 2) {
            // If it's modern RAM and formatted as [Gen, Speed]
            parsedGeneration = "DDR" + item.speed[0];
            parsedSpeedMhz = item.speed[1] || 0;
        } else if (typeof item.speed === 'number') {
            // If it's legacy RAM and just a single number
            parsedSpeedMhz = item.speed;
        }

        return prisma.part.create({
            data: {
                name: item.name,
                brand: item.name.split(" ")[0] || "Unknown",
                category: "RAM",
                basePrice: item.price,
                ramDetails: {
                    create: {
                        capacityGb: item.modules[0] * item.modules[1], // e.g., 2 * 16 = 32GB
                        stickSize: item.modules[1],
                        stickCount: item.modules[0],
                        speedMhz: parsedSpeedMhz,
                        generation: parsedGeneration
                    } 
                }
            }
        });
    })
    

    // --- STORAGE ---
    
    console.log("Processing Storage...");
    const storageData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/storage.json'), 'utf8')) as StorageJson[];

    await seedInBatches(storageData, BATCH_SIZE, (item) => {
        let normalizedType = String(item.type);

        // If the type is a number, it is an HDD
        if (!isNaN(Number(item.type))) {
            normalizedType = "HDD";
        }

        return prisma.part.create({
            data: {
                name: item.name,
                brand: item.name.split(" ")[0] || "Unknown",
                category: "Storage",
                basePrice: item.price,
                storageDetails: {
                    create: {
                        capacityGb: item.capacity,
                        type: normalizedType,
                        interface: item.interface
                    }
                }
            }
        });
    })

    // --- COOLER ---
    
    console.log("Processing Cooler...");
    const coolerData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/Cooler.json'), 'utf8')) as CoolerJson[];

    await seedInBatches(coolerData, BATCH_SIZE, (item) => {
        let finalRpm = 0;
        let finalNoise = 0;

        if (Array.isArray(item.rpm)) {
            // Take max RPM value, fallback to minimum RPM
            finalRpm = item.rpm[1] || item.rpm[0] || 0;
        }
        else {
            finalRpm = item.rpm;
        }

        if (Array.isArray(item.noise_level)) {
            // Take max noise value, fallback to minimum noise
            finalNoise = item.noise_level[1] || item.noise_level[0] || 0;
        }
        else {
            finalNoise = item.noise_level;
        }

        return prisma.part.create({
            data: {
                name: item.name,
                brand: item.name.split(" ")[0] || "Unknown",
                category: "Cooler",
                basePrice: item.price,
                coolerDetails: {
                    create: {
                        rpm: finalRpm,
                        noise_level: finalNoise
                    }
                }
            }
        })
    })
    

    console.log("All parts have been successfully uploaded to the database!");
}

// EXECUTION AND ERROR HANDLING
main()
    .catch((e) => {
        console.error("An error occured: ", e);
        process.exit(1);
    })
    .finally(async() => {
        await prisma.$disconnect();
    })