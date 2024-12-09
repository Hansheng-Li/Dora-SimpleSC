const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0x0eba532B0Bf861ae8aF87B65effaf114705b9838";
    const blockNumberStart = 7233765;
    const blockNumberEnd = "latest";

    const Donation = await ethers.getContractAt("Donation", contractAddress);

    const filter = Donation.filters.EtherDeposited();
    const events = await Donation.queryFilter(filter, blockNumberStart, blockNumberEnd);

    console.log(`Found ${events.length} events`); 

    events.forEach(event => {
        console.log(`User ${event.args.user} deposited ${ethers.formatEther(event.args.amount)} Ether`);
    });
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });