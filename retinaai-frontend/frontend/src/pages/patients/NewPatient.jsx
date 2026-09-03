import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowLeft, HeartPulse, MapPin, Phone, ShieldAlert, Sparkles } from 'lucide-react';
import { patientService } from '../../services/entities.service';
import { useOffline } from '../../context/OfflineContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import GlassCard from '../../components/ui/GlassCard';
import SectionHeading from '../../components/ui/SectionHeading';
import toast from 'react-hot-toast';

export default function NewPatient() {
  const navigate = useNavigate();
  const { isOnline, queuePatientOffline } = useOffline();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    village: '',
    district: '',
    state: 'Karnataka',
    diabetesDuration: '1-5 years',
    knownDiabetic: true,
    previousEyeProblems: 'None',
    emergencyContact: {
      name: '',
      phone: '',
      relation: '',
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('ec_')) {
      const field = name.replace('ec_', '');
      setFormData((prev) => ({
        ...prev,
        emergencyContact: { ...prev.emergencyContact, [field]: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      age: Number(formData.age),
    };

    try {
      if (!isOnline) {
        await queuePatientOffline(payload);
        navigate('/patients');
        return;
      }

      const res = await patientService.create(payload);
      toast.success('Patient registered successfully!');
      // Prompt user to immediately screen this patient
      navigate('/screenings/new', { state: { selectedPatient: res.data.patient } });
    } catch (err) {
      if (!isOnline) {
        await queuePatientOffline(payload);
        navigate('/patients');
      } else {
        toast.error(err.response?.data?.message || 'Failed to register patient');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Heading */}
      <div className="flex items-center gap-3">
        <Link
          to="/patients"
          className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Register New Patient</h1>
          <p className="text-slate-400 text-xs sm:text-sm">Demographic and diabetic ophthalmic intake form</p>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Demographics */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-5 border border-slate-800 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <UserPlus className="w-4 h-4 text-cyan-400" />
            Demographic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                name="name"
                label="Full Name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Ramesh Gowda"
              />
            </div>

            <div>
              <Input
                name="age"
                type="number"
                label="Age (Years)"
                required
                min="1"
                max="125"
                value={formData.age}
                onChange={handleChange}
                placeholder="58"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Gender *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Male', 'Female', 'Other'].map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setFormData((prev) => ({ ...prev, gender: g }))}
                    className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                      formData.gender === g
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Input
                name="phone"
                type="tel"
                label="Phone Number (10-Digit)"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9845123456"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Rural Community Location */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-5 border border-slate-800 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <MapPin className="w-4 h-4 text-emerald-400" />
            Rural Community Location
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              name="village"
              label="Village / Ward"
              required
              value={formData.village}
              onChange={handleChange}
              placeholder="e.g. Channapatna"
            />

            <Input
              name="district"
              label="District"
              required
              value={formData.district}
              onChange={handleChange}
              placeholder="e.g. Ramanagara"
            />

            <Input
              name="state"
              label="State"
              required
              value={formData.state}
              onChange={handleChange}
              placeholder="Karnataka"
            />
          </div>
        </div>

        {/* Section 3: Diabetic & Eye History */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-5 border border-slate-800 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <HeartPulse className="w-4 h-4 text-purple-400" />
            Diabetic & Ophthalmic History
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Known Duration of Diabetes
              </label>
              <select
                name="diabetesDuration"
                value={formData.diabetesDuration}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500/80 cursor-pointer"
              >
                <option value="< 1 year">Less than 1 year</option>
                <option value="1-5 years">1 to 5 years</option>
                <option value="5-10 years">5 to 10 years</option>
                <option value="10+ years">More than 10 years (High Risk)</option>
                <option value="Unknown">Unknown / Newly Diagnosed</option>
              </select>
            </div>

            <Input
              name="previousEyeProblems"
              label="Reported Eye Symptoms"
              value={formData.previousEyeProblems}
              onChange={handleChange}
              placeholder="e.g. Blurred vision, floaters, night blindness"
            />
          </div>
        </div>

        {/* Section 4: Emergency Contact */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-5 border border-slate-800 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Emergency Contact / Guardian (Optional)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              name="ec_name"
              label="Contact Name"
              value={formData.emergencyContact.name}
              onChange={handleChange}
              placeholder="e.g. Suresh Gowda"
            />

            <Input
              name="ec_relation"
              label="Relation"
              value={formData.emergencyContact.relation}
              onChange={handleChange}
              placeholder="Son / Spouse / Guardian"
            />

            <Input
              name="ec_phone"
              type="tel"
              label="Contact Phone"
              value={formData.emergencyContact.phone}
              onChange={handleChange}
              placeholder="9845123457"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={() => navigate('/patients')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="cyan"
            loading={loading}
            icon={UserPlus}
            className="shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            Register & Proceed to Screening
          </Button>
        </div>
      </form>
    </div>
  );
}
