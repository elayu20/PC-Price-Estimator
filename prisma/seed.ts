// IMPORTS
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { cpuSocket, motherboardSocket, motherboardMemoryType } from './partSpecs.ts';

// INITIALIZATION
const prisma = new PrismaClient(); // turns engine on

// INTERFACES

// Define what a CPU object looks like in JSON data
interface CpuJson {
    name: string;
    price: number | null;
    microarchitecture: string;
    core_count: number;
    tdp: number;
}

// Define Motherboard in JSON data
interface MotherboardJson {
    name: string;
    price: number | null;
    socket: string;
    form_factor: string;
    memory_slots: number;
}

interface GpuJson {
    name: string;
    price: number | null;
    chipset: string;
    memory: number;
}

interface PsuJson {
    name: string;
    price: number | null;
    type: string;
    efficiency: string;
    modular: string;
    wattage: number;
}

interface RamJson {
    name: string;
    price: number | null;
    speed: number | number[];
    modules: [number, number];
}

interface StorageJson {
    name: string;
    price: number | null;
    type: string | number;
    capacity: number;
    interface: string;
}

interface CoolerJson {
    name: string;
    price: number | null;
    rpm: number | number[];
    noise_level: number | number[];
}

// Batch helper function
async function seedInBatches<T>(dataArray: T[], batchSize: number, createFunction: (item: T) => Promise<any>) {
    for (let i = 0; i < dataArray.length; i+= batchSize) {
        const batch = dataArray.slice(i, i + batchSize);
        await Promise.all(batch.map(item => createFunction(item)));
        console.log(`...seeded ${Math.min(i + batchSize, dataArray.length)} of ${dataArray.length}`)
    }
}

// Deletes every part in a category (spec rows first, since they reference the part)
// so re-seeding it replaces the old rows instead of duplicating them
async function clearCategory(category: string, deleteSpecs: () => Promise<unknown>) {
    await deleteSpecs();
    const { count } = await prisma.part.deleteMany({ where: { category } });
    console.log(`...cleared ${count} existing ${category} parts`);
}

// MAIN FUNC
async function main() {
    console.log("Starting the database seeding process...");
    const BATCH_SIZE = 200;

    // --- CPUS ---
    
    console.log("Processing CPUs...");
    const cpuData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/cpus.json'), 'utf8')) as CpuJson[];
    await clearCategory("CPU", () => prisma.cpu.deleteMany());

    await seedInBatches(cpuData, BATCH_SIZE, (item) => {
        // Socket from the architecture, refined by name (HEDT, Threadripper, FX...)
        // "Unknown" if the architecture isn't recognized
        const detectedSocket = cpuSocket(item.name, item.microarchitecture);

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
    await clearCategory("Motherboard", () => prisma.motherboard.deleteMany());

    await seedInBatches(moboData, BATCH_SIZE, (item) => {

        return prisma.part.create({
            data: {
                name: item.name,
                brand: item.name.split(" ")[0] || "Unknown",
                category: "Motherboard",
                basePrice: item.price,
                motherboardDetails: {
                    create: {
                        socket: motherboardSocket(item.socket, item.name),
                        formFactor: item.form_factor,
                        ramSlots: item.memory_slots,
                        memoryType: motherboardMemoryType(item.socket, item.name),
                        hasWifi: item.name.includes("WIFI")
                    }
                }
            }
        })
    })

    // -- GPUS --

    /*
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
    */

    // --- PSUS ---
    
    /*
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
    */

    
    // --- RAM ---

    /*
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
    */
    

    // --- STORAGE ---
    
    /*
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
    */

    // --- COOLER ---

    /*
    console.log("Processing Cooler...");
    const coolerData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/cooler.json'), 'utf8')) as CoolerJson[];

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
    */


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
