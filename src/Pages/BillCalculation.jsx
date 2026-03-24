import { useEffect, useState } from "react";
import {
  Calculator,
  Stethoscope,
  Clock,
  BarChart3,
  DollarSign,
  Info,
} from "lucide-react";
import { PageNavigation } from "../components/ui/page-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

// Simple mock CPT rate table for UI-only math
const CPT_RATES = {
  "99213": 80,
  "99214": 120,
  "97110": 60,
  "99397": 90,
  "99406": 70,
};

export default function BillCalculation() {
  const [doctorName, setDoctorName] = useState("Dr. Anusha Yammada");
  const [specialty, setSpecialty] = useState("General Medicine");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [cptCodes, setCptCodes] = useState("99213, 97110");
  const [complexity, setComplexity] = useState("Medium");

  const [estimate, setEstimate] = useState(null);

  useEffect(() => {
    document.title = "Estimated Billing - Seismic Connect";
  }, []);

  const handleCalculate = () => {
    const codes = cptCodes
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    let baseTotal = 0;

    codes.forEach((code) => {
      const rate = CPT_RATES[code] || 50; // default fallback
      baseTotal += rate;
    });

    // Adjust based on duration (very simplistic mock)
    const durationFactor = durationMinutes / 30; // 30 min baseline
    baseTotal *= durationFactor;

    // Complexity factor
    let complexityMultiplier = 1;
    if (complexity === "Low") complexityMultiplier = 0.9;
    if (complexity === "Medium") complexityMultiplier = 1;
    if (complexity === "High") complexityMultiplier = 1.2;

    const finalTotal = baseTotal * complexityMultiplier;

    setEstimate({
      doctorName,
      specialty,
      durationMinutes,
      codes,
      complexity,
      baseTotal: baseTotal,
      finalTotal,
    });
  };

  return (
    <div className="px-4 pb-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageNavigation
          title="Estimated Billing"
          subtitle="Simulate billing amounts based on CPT codes, duration, and complexity"
          showDate={true}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Input form */}
          <Card className="xl:col-span-2 shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">
                  Billing Estimation Setup
                </CardTitle>
                <p className="text-sm text-blue-100 mt-1">
                  Enter provider details, duration, and CPT codes to calculate a
                  rough estimate.
                    </p>
                  </div>
                </div>
              </CardHeader>

            <CardContent className="p-6 space-y-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1">
                    <Stethoscope className="w-3 h-3" />
                    Provider
                  </Label>
                  <Input
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="h-10 text-sm"
                    placeholder="Doctor or NP name"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1 block">
                    Specialty
                  </Label>
                  <Input
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="h-10 text-sm"
                    placeholder="e.g. General Medicine"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <Label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3" />
                    Session Duration (min)
                  </Label>
                  <Input
                    type="number"
                    min={5}
                    max={240}
                    value={durationMinutes}
                    onChange={(e) =>
                      setDurationMinutes(Number(e.target.value || 0))
                    }
                    className="h-10 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1">
                    <BarChart3 className="w-3 h-3" />
                    Complexity
                  </Label>
                  <select
                    value={complexity}
                    onChange={(e) => setComplexity(e.target.value)}
                    className="w-full h-10 text-sm border border-gray-200 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1">
                    <DollarSign className="w-3 h-3" />
                    Sample Rate Source (UI mock)
                  </Label>
                  <div className="text-[11px] text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-md px-3 py-2">
                    UI uses mock CPT rates only. Backend will replace math with
                    real AMA data.
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1 block">
                  CPT Codes (comma separated)
                </Label>
                <Input
                  value={cptCodes}
                  onChange={(e) => setCptCodes(e.target.value)}
                  className="h-10 text-sm"
                  placeholder="e.g. 99213, 97110"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  For demo: 99213, 99214, 97110, 99397, 99406 are pre-configured
                  with mock rates.
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm font-semibold shadow-md"
                  onClick={handleCalculate}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Estimate
                </Button>

              </div>
            </CardContent>
          </Card>

          {/* Right: Estimate summary */}
          <Card className="shadow-lg border-0 h-fit">
            <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Estimated Billing Summary
                  </CardTitle>
                  <p className="text-xs text-blue-100 mt-1">
                    Preview of estimated charges based on your inputs.
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4 bg-white">
              {!estimate && (
                <div className="text-sm text-gray-500 flex flex-col items-center justify-center py-8 text-center">
                  <Info className="w-5 h-5 mb-2 text-gray-400" />
                  <p>Fill in details on the left and click “Calculate Estimate”.</p>
                </div>
              )}

              {estimate && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Provider</span>
                      <span className="font-medium text-gray-900">
                        {estimate.doctorName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Specialty</span>
                      <span className="font-medium text-gray-900">
                        {estimate.specialty}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Duration</span>
                      <span className="font-medium text-gray-900">
                        {estimate.durationMinutes} min
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Complexity</span>
                      <span className="font-medium text-gray-900">
                        {estimate.complexity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">CPT Codes</span>
                      <span className="font-medium text-gray-900">
                        {estimate.codes.join(", ")}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 my-3" />

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Base Amount</span>
                      <span className="font-semibold text-gray-900">
                        ${estimate.baseTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">
                        Adjusted for Duration & Complexity
                      </span>
                      <span className="font-semibold text-gray-900">
                        ${estimate.finalTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 my-3" />

                  <div className="text-[11px] text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-md p-3 flex gap-2">
                    <Info className="w-3 h-3 mt-[2px]" />
                    <p>
                      This is for estimation only. Final billing, insurance rules,
                      and AMA code pricing will be handled by the backend billing
                      engine.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
