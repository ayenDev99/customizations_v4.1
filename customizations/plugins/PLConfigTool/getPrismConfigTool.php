<?php
	$docDesignConfig = [];
    if (file_exists("../../config/doc_design_config.json")) {
        $docDesignConfig = file_get_contents("../../config/doc_design_config.json");
        $docDesignConfig = json_decode($docDesignConfig);
    }

	$defaultSBSConfig = [];
    $currentSBSConfig = [];

    $defaultStoreConfig = [];
    $currentStoreConfig = [];

    $defaultWSConfig = [];
    $currentWSConfig = [];

    $defaultSBSConfig = (count($docDesignConfig)) ? current((array)$docDesignConfig) : [] ;

    foreach ($docDesignConfig as $key => $sbs) {

        if (isset($sbs->subsidiaryNo) && isset($sbs->stores)) {

            if ($sbs->subsidiaryNo == $_GET['sbsNo']) {

               $currentSBSConfig = $sbs;

                $defaultStoreConfig = current((array)$sbs->stores);

                foreach ($sbs->stores as $key => $store) {
                    
                    if (isset($store->storeNo) && isset($store->workstations)) {

                        if ($store->storeNo == $_GET['storeNo']) {

                            $currentStoreConfig = $store;

                            $defaultWSConfig = current((array)$store->workstations);

                            foreach ($store->workstations as $workstation) {

                                if (isset($workstation->workstationNo)) {
                                    if ($workstation->workstationNo == $_GET['workstationNo']) {

                                        $currentWSConfig = $workstation;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    $SBSConfig = (count($currentSBSConfig)) ? $currentSBSConfig : $defaultSBSConfig ;
    $storeConfig = (count($currentStoreConfig)) ? $currentStoreConfig : $defaultStoreConfig ;
    $WSConfig = (count($currentWSConfig)) ? $currentWSConfig : $defaultWSConfig ;

    $address1 = (isset($storeConfig->address1)) ? $storeConfig->address1 : '' ;
    $address2 = (isset($storeConfig->address2)) ? $storeConfig->address2 : '' ;
    $address3 = (isset($storeConfig->address3)) ? $storeConfig->address3 : '' ;
    $address4 = (isset($storeConfig->address4)) ? $storeConfig->address4 : '' ;
    $address5 = (isset($storeConfig->address5)) ? $storeConfig->address5 : '' ;
    $address6 = (isset($storeConfig->address6)) ? $storeConfig->address6 : '' ;

    $vatRegTin = (isset($storeConfig->vatRegTin)) ? $storeConfig->vatRegTin : '' ;
    $serialNumber = (isset($WSConfig->serialNo)) ? $WSConfig->serialNo : '' ;
    $min = (isset($WSConfig->min)) ? $WSConfig->min : '' ;
    $sotftwareVersion = (isset($storeConfig->softwareVersion)) ? $storeConfig->softwareVersion : '' ;
    $ptuNo = (isset($WSConfig->ptuNo)) ? $WSConfig->ptuNo : '' ;
    $dateIssue = (isset($WSConfig->dateIssue)) ? $WSConfig->dateIssue : '' ;
    $validUntil = (isset($WSConfig->validUntil)) ? $WSConfig->validUntil : '' ;

    $data = 
    	"vrts" . $vatRegTin 	. "vrte," . 
    	"ad1s" . $address1 		. "ad1e," .
    	"ad2s" . $address2 		. "ad2e," .
    	"ad3s" . $address3 		. "ad3e," . 
    	"ad4s" . $address4 		. "ad4e," .
    	"ad5s" . $address5 		. "ad5e," .
    	"ad6s" . $address6 		. "ad6e," .
    	"mins" . $min 	   		. "mine," .
    	"srns" . $serialNumber 	. "srne," .
    	"dtis" . $dateIssue 	. "dtie," .
    	"vdus" . $validUntil 	. "vdue," .
    	"ptus" . $ptuNo 		. "ptue";
	
    echo json_encode(['results' => $data]);