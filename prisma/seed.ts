// IMPORTS
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { cpuSocket, motherboardSocket, motherboardMemoryType, uniqueNames, capacityLabel, searchQuery, withExtra, gpuModel } from './partSpecs.ts';

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
    rpm: number | number[] | null;
    noise_level: number | number[] | null;
    size: number | null; // radiator size in mm, null for air coolers
}

function readJson<T>(file: string): T[] {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', file), 'utf8')) as T[];
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
// so re-seeding it replaces the old rows instead of duplicating them.
// Cached prices are deleted along with their part (onDelete: Cascade)
async function clearCategory(category: string, deleteSpecs: () => Promise<unknown>) {
    await deleteSpecs();
    const { count } = await prisma.part.deleteMany({ where: { category } });
    console.log(`...cleared ${count} existing ${category} parts`);
}

// Fields shared by every part row. `name` must be unique within its category
function partFields(name: string, item: { name: string; price: number | null }, category: string, query: string) {
    return {
        name,
        brand: item.name.split(" ")[0] || "Unknown",
        category,
        basePrice: item.price,
        searchQuery: query,
    };
}

// MAIN FUNC
async function main() {
    console.log("Starting the database seeding process...");
    const BATCH_SIZE = 200;

    // --- CPUS ---

    console.log("Processing CPUs...");
    // Same-name CPUs in the dataset are exact duplicates, so no labels are needed
    const cpuData = uniqueNames(readJson<CpuJson>('cpus.json'), item => item.name, () => []);
    await clearCategory("CPU", () => prisma.cpu.deleteMany());

    await seedInBatches(cpuData, BATCH_SIZE, ({ item, name }) => {
        // Socket from the architecture, refined by name (HEDT, Threadripper, FX...)
        // "Unknown" if the architecture isn't recognized
        const detectedSocket = cpuSocket(item.name, item.microarchitecture);

        return prisma.part.create({
            data: {
                ...partFields(name, item, "CPU", searchQuery(item.name)),
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
    // A couple of names (e.g. "EVGA Classified") cover boards for different sockets
    const moboData = uniqueNames(readJson<MotherboardJson>('motherboard.json'), item => item.name, item => [item.socket]);
    await clearCategory("Motherboard", () => prisma.motherboard.deleteMany());

    await seedInBatches(moboData, BATCH_SIZE, ({ item, name }) => {

        return prisma.part.create({
            data: {
                ...partFields(name, item, "Motherboard", searchQuery(item.name)),
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

    console.log("Processing GPUs...");
    // Board partner names like "Gigabyte GAMING OC" are reused across chipsets, so the
    // chipset is part of the name unless the name already has it ("MSI GeForce RTX 3060 Ventus")
    const gpuData = uniqueNames(
        readJson<GpuJson>('gpus.json'),
        item => withExtra(item.name, item.chipset, gpuModel(item.chipset)),
        item => [`${item.memory}GB`],
    );
    await clearCategory("GPU", () => prisma.gpu.deleteMany());

    await seedInBatches(gpuData, BATCH_SIZE, ({ item, name }) => {
        return prisma.part.create({
            data: {
                ...partFields(name, item, "GPU", searchQuery(withExtra(item.name, gpuModel(item.chipset)))),
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
    const psuData = uniqueNames(
        readJson<PsuJson>('psu.json'),
        item => item.name,
        item => [`${item.wattage}W`, item.efficiency || "", item.modular ? `${item.modular} modular` : "non-modular", item.type],
    );
    await clearCategory("PSU", () => prisma.psu.deleteMany());

    await seedInBatches(psuData, BATCH_SIZE, ({ item, name }) => {
        return prisma.part.create({
            data: {
                ...partFields(name, item, "PSU", searchQuery(withExtra(item.name, `${item.wattage}W`, String(item.wattage)))),
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
    // Generation/speed and stick layout of a RAM kit, e.g. ["DDR4", 3200, 2, 8].
    // Legacy RAM lists speed as a single number, with no generation
    function ramSpecs(item: RamJson) {
        if (Array.isArray(item.speed) && item.speed.length >= 2) {
            // If it's modern RAM and formatted as [Gen, Speed]
            return { generation: "DDR" + item.speed[0], speedMhz: item.speed[1] || 0 };
        }
        return { generation: "Unknown", speedMhz: typeof item.speed === 'number' ? item.speed : 0 };
    }

    // One name covers many kits, e.g. "Corsair Vengeance LPX 16 GB (DDR4-3200, 2 x 8GB)"
    const ramData = uniqueNames(readJson<RamJson>('ram.json'), item => item.name, item => {
        const { generation, speedMhz } = ramSpecs(item);
        const speed = generation === "Unknown" ? `${speedMhz} MHz` : `${generation}-${speedMhz}`;
        return [speed, `${item.modules[0]} x ${item.modules[1]}GB`];
    });
    await clearCategory("RAM", () => prisma.ram.deleteMany());

    await seedInBatches(ramData, BATCH_SIZE, ({ item, name }) => {
        const { generation, speedMhz } = ramSpecs(item);
        // Names already include the total capacity ("16 GB"); speed tells kits apart on eBay
        const query = searchQuery(item.name, generation === "Unknown" ? "" : generation, String(speedMhz));

        return prisma.part.create({
            data: {
                ...partFields(name, item, "RAM", query),
                ramDetails: {
                    create: {
                        capacityGb: item.modules[0] * item.modules[1], // e.g., 2 * 16 = 32GB
                        stickSize: item.modules[1],
                        stickCount: item.modules[0],
                        speedMhz,
                        generation
                    }
                }
            }
        });
    })


    // --- STORAGE ---

    console.log("Processing Storage...");
    // If the type is a number (spindle RPM), it is an HDD
    const storageType = (item: StorageJson) => isNaN(Number(item.type)) ? String(item.type) : "HDD";

    // One name covers every capacity, e.g. "Samsung 990 Pro (2TB)"
    const storageData = uniqueNames(
        readJson<StorageJson>('storage.json'),
        item => item.name,
        item => [capacityLabel(item.capacity), storageType(item), item.interface],
    );
    await clearCategory("Storage", () => prisma.storage.deleteMany());

    await seedInBatches(storageData, BATCH_SIZE, ({ item, name }) => {
        return prisma.part.create({
            data: {
                ...partFields(name, item, "Storage", searchQuery(withExtra(item.name, capacityLabel(item.capacity)))),
                storageDetails: {
                    create: {
                        capacityGb: item.capacity,
                        type: storageType(item),
                        interface: item.interface
                    }
                }
            }
        });
    })

    // --- COOLER ---

    console.log("Processing Cooler...");
    // Takes max value of a [min, max] range, falls back to minimum
    const maxOf = (value: number | number[] | null) => Array.isArray(value) ? value[1] || value[0] || 0 : value;

    // AIO names are reused across radiator sizes, e.g. "Thermalright Aqua Elite V3 (240mm)"
    const coolerData = uniqueNames(
        readJson<CoolerJson>('cooler.json'),
        item => item.name,
        item => {
            const rpm = maxOf(item.rpm);
            const noise = maxOf(item.noise_level);
            return [item.size ? `${item.size}mm` : "", rpm ? `${rpm} RPM` : "", noise ? `${noise} dB` : ""];
        },
    );
    await clearCategory("Cooler", () => prisma.cooler.deleteMany());

    await seedInBatches(coolerData, BATCH_SIZE, ({ item, name }) => {
        // AIO titles give the radiator size, e.g. "360mm"
        const query = searchQuery(item.size ? withExtra(item.name, String(item.size)) : item.name);

        return prisma.part.create({
            data: {
                ...partFields(name, item, "Cooler", query),
                coolerDetails: {
                    create: {
                        rpm: maxOf(item.rpm),
                        noise_level: maxOf(item.noise_level)
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
