declare module 'solc' {
    interface SolcOutput {
        errors?: Array<{
            severity: 'error' | 'warning';
            formattedMessage: string;
        }>;
        contracts: {
            [fileName: string]: {
                [contractName: string]: {
                    abi: any;
                    evm: {
                        bytecode: {
                            object: string;
                        };
                    };
                };
            };
        };
    }

    function compile(input: string, callbacks?: any): string;
    const features: any;
}
